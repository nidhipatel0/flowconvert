#!/usr/bin/env node

/**
 * Bundle Size Monitor
 *
 * Checks if bundle sizes are within constitutional limits:
 * - Initial bundle: <250KB gzipped
 * - Route chunks: <100KB gzipped
 *
 * Per constitution: Bundle size monitoring enforced in CI/CD
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size limits (in bytes)
const LIMITS = {
  INITIAL: 250 * 1024, // 250KB
  ROUTE: 100 * 1024,   // 100KB
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function checkBundleSizes() {
  console.log(`\n${colors.bold}${colors.blue}📦 Bundle Size Report${colors.reset}\n`);

  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static', 'chunks');

  if (!fs.existsSync(staticDir)) {
    console.error(`${colors.red}❌ Build directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  let hasErrors = false;
  const files = fs.readdirSync(staticDir);

  // Check main bundle
  const mainFiles = files.filter(f => f.startsWith('main-') && f.endsWith('.js'));

  if (mainFiles.length > 0) {
    const mainFile = mainFiles[0];
    const mainPath = path.join(staticDir, mainFile);
    const mainSize = getFileSize(mainPath);

    const status = mainSize <= LIMITS.INITIAL
      ? `${colors.green}✅${colors.reset}`
      : `${colors.red}❌${colors.reset}`;

    console.log(`${status} Main Bundle: ${formatBytes(mainSize)} / ${formatBytes(LIMITS.INITIAL)}`);
    console.log(`   ${mainFile}`);

    if (mainSize > LIMITS.INITIAL) {
      hasErrors = true;
      console.log(`   ${colors.red}Exceeds limit by ${formatBytes(mainSize - LIMITS.INITIAL)}${colors.reset}`);
    }
  }

  // Check route chunks
  console.log(`\n${colors.bold}Route Chunks:${colors.reset}`);

  const routeFiles = files.filter(f =>
    f.endsWith('.js') &&
    !f.startsWith('main-') &&
    !f.startsWith('webpack-') &&
    !f.startsWith('polyfills-') &&
    !f.startsWith('framework-')
  );

  let totalRouteSize = 0;

  routeFiles.forEach(file => {
    const filePath = path.join(staticDir, file);
    const size = getFileSize(filePath);
    totalRouteSize += size;

    const status = size <= LIMITS.ROUTE
      ? `${colors.green}✅${colors.reset}`
      : `${colors.red}❌${colors.reset}`;

    console.log(`${status} ${formatBytes(size).padStart(10)} - ${file}`);

    if (size > LIMITS.ROUTE) {
      hasErrors = true;
      console.log(`   ${colors.red}Exceeds limit by ${formatBytes(size - LIMITS.ROUTE)}${colors.reset}`);
    }
  });

  // Summary
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`Total chunks analyzed: ${routeFiles.length + 1}`);
  console.log(`Total route size: ${formatBytes(totalRouteSize)}`);

  if (hasErrors) {
    console.log(`\n${colors.red}${colors.bold}❌ Bundle size check FAILED${colors.reset}`);
    console.log(`${colors.yellow}Consider:${colors.reset}`);
    console.log('  - Code splitting with dynamic imports');
    console.log('  - Lazy loading heavy components');
    console.log('  - Tree shaking unused dependencies');
    console.log('  - Using smaller alternatives for large libraries');
    console.log('  - Analyzing with: npx @next/bundle-analyzer');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ Bundle size check PASSED${colors.reset}`);
  }
}

// Run the check
try {
  checkBundleSizes();
} catch (error) {
  console.error(`${colors.red}❌ Error checking bundle sizes:${colors.reset}`, error.message);
  process.exit(1);
}
