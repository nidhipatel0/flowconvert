/**
 * Document Requirements Configuration
 * Defines specifications for Indian government documents
 */

export type DocumentCategory = 
  | 'driving-license'
  | 'aadhaar'
  | 'pan-card'
  | 'passport'
  | 'visa'
  | 'mahadbt-scholarship'
  | 'digilocker'
  | 'birth-certificate'
  | 'bank-passbook'
  | 'electricity-bill'
  | 'educational-certificate'
  | 'caste-certificate'
  | 'income-certificate'
  | 'employment-letter';

export type FileType = 'photo' | 'signature' | 'document';

export interface FileRequirement {
  type: FileType;
  label: string;
  description?: string;
  width?: number; // pixels
  height?: number; // pixels
  dpi?: number;
  maxSizeKB: number;
  formats: string[]; // ['JPEG', 'JPG', 'PNG', 'PDF']
  aspectRatio?: string; // e.g., '3:4'
  backgroundColor?: 'white' | 'transparent' | 'any';
  required: boolean;
}

export interface DocumentRequirements {
  id: DocumentCategory;
  name: string;
  description: string;
  category: string;
  icon: string;
  files: FileRequirement[];
}

export const DOCUMENT_REQUIREMENTS: DocumentRequirements[] = [
  {
    id: 'driving-license',
    name: 'Driving License (RTO)',
    description: 'Documents required for driving license application',
    category: 'Identity',
    icon: '🚗',
    files: [
      {
        type: 'photo',
        label: 'Passport Photo',
        description: '35×45 mm with white background',
        width: 420,
        height: 525,
        dpi: 300,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'signature',
        label: 'Signature',
        width: 200,
        height: 80,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'ID Proof',
        description: 'Aadhaar, PAN, Passport, etc.',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Address Proof',
        description: 'Electricity bill, bank statement, etc.',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    description: 'Documents required for Aadhaar enrollment/update',
    category: 'Identity',
    icon: '🆔',
    files: [
      {
        type: 'photo',
        label: 'Passport Photo',
        width: 420,
        height: 525,
        dpi: 300,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'signature',
        label: 'Signature',
        width: 256,
        height: 64,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Proof of Identity',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'Proof of Address',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'Date of Birth Proof',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
    ],
  },
  {
    id: 'pan-card',
    name: 'PAN Card',
    description: 'Documents required for PAN card application',
    category: 'Identity',
    icon: '💳',
    files: [
      {
        type: 'photo',
        label: 'Passport Photo',
        width: 300,
        height: 400,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'signature',
        label: 'Signature',
        width: 200,
        height: 80,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'ID Proof',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Address Proof',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'Documents required for passport application',
    category: 'Travel',
    icon: '🛂',
    files: [
      {
        type: 'photo',
        label: 'Passport Photo (2×2 inch)',
        description: 'White background, 600×600 px recommended',
        width: 600,
        height: 600,
        maxSizeKB: 300,
        formats: ['JPEG', 'JPG', 'PNG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'document',
        label: 'ID Proof',
        dpi: 300,
        maxSizeKB: 1024,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Address Proof',
        dpi: 300,
        maxSizeKB: 1024,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Date of Birth Proof',
        dpi: 300,
        maxSizeKB: 1024,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'visa',
    name: 'Visa (India)',
    description: 'Documents required for India visa application',
    category: 'Travel',
    icon: '✈️',
    files: [
      {
        type: 'photo',
        label: 'Visa Photo (35×45 mm)',
        width: 350,
        height: 450,
        maxSizeKB: 300,
        formats: ['JPEG', 'JPG', 'PNG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'document',
        label: 'Passport Copy',
        maxSizeKB: 1024,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'mahadbt-scholarship',
    name: 'MahaDBT / Scholarships',
    description: 'Documents for scholarship applications',
    category: 'Education',
    icon: '🎓',
    files: [
      {
        type: 'photo',
        label: 'Passport Photo',
        width: 420,
        height: 525,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        backgroundColor: 'white',
        required: true,
      },
      {
        type: 'signature',
        label: 'Signature',
        width: 256,
        height: 64,
        maxSizeKB: 20,
        formats: ['JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Income Certificate',
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'Caste Certificate',
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'Educational Certificate',
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
    ],
  },
  {
    id: 'digilocker',
    name: 'DigiLocker',
    description: 'Documents for DigiLocker upload',
    category: 'Storage',
    icon: '🔐',
    files: [
      {
        type: 'document',
        label: 'Any Document',
        description: 'Any government document',
        dpi: 300,
        maxSizeKB: 10240, // 10 MB
        formats: ['PDF', 'JPEG', 'JPG', 'PNG', 'BMP', 'GIF'],
        required: true,
      },
    ],
  },
  {
    id: 'birth-certificate',
    name: 'Birth Certificate',
    description: 'Birth certificate document',
    category: 'Documents',
    icon: '👶',
    files: [
      {
        type: 'document',
        label: 'Birth Certificate Scan',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'bank-passbook',
    name: 'Bank Passbook / Statement',
    description: 'Bank documents for verification',
    category: 'Financial',
    icon: '🏦',
    files: [
      {
        type: 'document',
        label: 'Passbook Page',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
      {
        type: 'document',
        label: 'Bank Statement',
        dpi: 200,
        maxSizeKB: 1024,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
    ],
  },
  {
    id: 'electricity-bill',
    name: 'Electricity Bill',
    description: 'Electricity bill for address proof',
    category: 'Documents',
    icon: '💡',
    files: [
      {
        type: 'document',
        label: 'Bill Scan',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'educational-certificate',
    name: 'Educational Certificates',
    description: 'SSC, HSC, Degree certificates',
    category: 'Education',
    icon: '📜',
    files: [
      {
        type: 'document',
        label: 'SSC Certificate',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'HSC Certificate',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
      {
        type: 'document',
        label: 'Degree Certificate',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: false,
      },
    ],
  },
  {
    id: 'caste-certificate',
    name: 'Caste Certificate',
    description: 'Caste certificate document',
    category: 'Documents',
    icon: '📄',
    files: [
      {
        type: 'document',
        label: 'Caste Certificate',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'income-certificate',
    name: 'Income Certificate',
    description: 'Income certificate document',
    category: 'Documents',
    icon: '💰',
    files: [
      {
        type: 'document',
        label: 'Income Certificate',
        dpi: 200,
        maxSizeKB: 300,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
  {
    id: 'employment-letter',
    name: 'Employment Letter',
    description: 'Employment letter or certificate',
    category: 'Documents',
    icon: '💼',
    files: [
      {
        type: 'document',
        label: 'Employment Letter',
        dpi: 200,
        maxSizeKB: 500,
        formats: ['PDF', 'JPEG', 'JPG'],
        required: true,
      },
    ],
  },
];

// Helper function to get document by ID
export function getDocumentRequirements(id: DocumentCategory): DocumentRequirements | undefined {
  return DOCUMENT_REQUIREMENTS.find(doc => doc.id === id);
}

// Get all categories
export function getAllCategories(): string[] {
  return Array.from(new Set(DOCUMENT_REQUIREMENTS.map(doc => doc.category)));
}

// Get documents by category
export function getDocumentsByCategory(category: string): DocumentRequirements[] {
  return DOCUMENT_REQUIREMENTS.filter(doc => doc.category === category);
}

