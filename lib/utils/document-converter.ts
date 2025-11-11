/**
 * Document Conversion Utilities
 *
 * Server-side document conversion helpers
 * Requires LibreOffice headless or Apache POI
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Temporary file storage directory
const TEMP_DIR = path.join(process.cwd(), '.temp', 'conversions');

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits

/**
 * Generate encryption key from password
 */
function generateEncryptionKey(password: string): Buffer {
  return crypto.scryptSync(password, 'salt', ENCRYPTION_KEY_LENGTH);
}

/**
 * Encrypt file buffer
 */
export function encryptFile(buffer: Buffer, password: string): Buffer {
  const key = generateEncryptionKey(password);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV, authTag, and encrypted data
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt file buffer
 */
export function decryptFile(encryptedBuffer: Buffer, password: string): Buffer {
  const key = generateEncryptionKey(password);

  const iv = encryptedBuffer.subarray(0, 16);
  const authTag = encryptedBuffer.subarray(16, 32);
  const encrypted = encryptedBuffer.subarray(32);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Save temporary file with encryption
 */
export async function saveTempFile(
  buffer: Buffer,
  format: string,
  encrypt = true
): Promise<string> {
  // Ensure temp directory exists
  await fs.mkdir(TEMP_DIR, { recursive: true });

  // Generate unique filename
  const filename = `${crypto.randomBytes(16).toString('hex')}.${format}`;
  const filePath = path.join(TEMP_DIR, filename);

  // Encrypt if requested
  const dataToSave = encrypt
    ? encryptFile(buffer, process.env.FILE_ENCRYPTION_KEY || 'default-key-change-in-production')
    : buffer;

  // Save file
  await fs.writeFile(filePath, dataToSave);

  return filePath;
}

/**
 * Read temporary file with decryption
 */
export async function readTempFile(
  filePath: string,
  decrypt = true
): Promise<Buffer> {
  const encryptedBuffer = await fs.readFile(filePath);

  if (decrypt) {
    return decryptFile(
      encryptedBuffer,
      process.env.FILE_ENCRYPTION_KEY || 'default-key-change-in-production'
    );
  }

  return encryptedBuffer;
}

/**
 * Delete temporary file
 */
export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete temp file:', filePath, error);
  }
}

/**
 * Schedule file deletion after timeout
 */
export function scheduleFileDeletion(...filePaths: string[]): void {
  const deleteAfter = 5 * 60 * 1000; // 5 minutes

  setTimeout(async () => {
    for (const filePath of filePaths) {
      await deleteTempFile(filePath);
    }
  }, deleteAfter);
}

/**
 * Convert document using LibreOffice headless
 * NOTE: Requires LibreOffice to be installed on the server
 */
export async function convertWithLibreOffice(
  _inputPath: string,
  _targetFormat: string
): Promise<string> {
  // This is a placeholder implementation
  // In production, you would use child_process to call LibreOffice:
  //
  // import { exec } from 'child_process';
  // import { promisify } from 'util';
  // const execAsync = promisify(exec);
  //
  // const outputDir = path.dirname(inputPath);
  // const command = `libreoffice --headless --convert-to ${targetFormat} --outdir ${outputDir} ${inputPath}`;
  // await execAsync(command);
  //
  // const baseName = path.basename(inputPath, path.extname(inputPath));
  // return path.join(outputDir, `${baseName}.${targetFormat}`);

  throw new Error('LibreOffice conversion not implemented. Install LibreOffice on the server and configure the conversion command.');
}

/**
 * Convert PDF to Office format
 * Requires pdf-lib and mammoth/xlsx libraries
 */
export async function convertPdfToOffice(
  _pdfBuffer: Buffer,
  targetFormat: 'docx' | 'xlsx' | 'pptx',
  _options?: { preserveFormatting?: boolean }
): Promise<Buffer> {
  // This would require complex PDF parsing and Office document generation
  // Recommended approach: Use LibreOffice headless or paid API like CloudConvert

  throw new Error(`PDF to ${targetFormat.toUpperCase()} conversion not implemented. This requires LibreOffice headless or a third-party API.`);
}

/**
 * Convert Office to PDF
 * Requires LibreOffice headless
 */
export async function convertOfficeToPdf(
  officeBuffer: Buffer,
  sourceFormat: 'docx' | 'xlsx' | 'pptx',
  _options?: { quality?: number }
): Promise<Buffer> {
  // Save to temp file
  const inputPath = await saveTempFile(officeBuffer, sourceFormat, false);

  try {
    // Convert using LibreOffice
    const outputPath = await convertWithLibreOffice(inputPath, 'pdf');

    // Read converted file
    const pdfBuffer = await fs.readFile(outputPath);

    // Clean up
    await deleteTempFile(inputPath);
    await deleteTempFile(outputPath);

    return pdfBuffer;
  } catch (error) {
    await deleteTempFile(inputPath);
    throw error;
  }
}

/**
 * Convert images to PDF
 * Uses pdf-lib
 */
export async function convertImagesToPdf(
  imageBuffers: Buffer[],
  _options?: { quality?: number }
): Promise<Buffer> {
  // This would use pdf-lib to create a PDF with embedded images
  // Implementation similar to what we might do client-side

  const { PDFDocument } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();

  for (const imageBuffer of imageBuffers) {
    // Detect image type and embed
    let image;
    try {
      image = await pdfDoc.embedJpg(imageBuffer);
    } catch {
      try {
        image = await pdfDoc.embedPng(imageBuffer);
      } catch {
        throw new Error('Unsupported image format. Use JPG or PNG.');
      }
    }

    // Add page with image
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Clean up old temp files (run periodically)
 */
export async function cleanupOldTempFiles(maxAgeMinutes = 10): Promise<void> {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await deleteTempFile(filePath);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
  }
}
