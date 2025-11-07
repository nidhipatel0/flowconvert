/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for development best practices
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // TypeScript configuration
  typescript: {
    // Type checking happens in CI/CD, don't block builds
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Fail builds on ESLint errors
    ignoreDuringBuilds: false,
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle worker files
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    // Handle WASM files for Tesseract.js
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ignore source map warnings from third-party packages
    config.ignoreWarnings = [/Failed to parse source map/];

    return config;
  },

  // Server-side configuration
  serverRuntimeConfig: {
    // Maximum file upload size (50MB for free tier)
    maxFileSize: 50 * 1024 * 1024,
  },

  // Public runtime configuration
  publicRuntimeConfig: {
    // Feature flags
    enableOCR: true,
    enableEdgeDetection: true,
    enableFileHistory: true,
    enableWorkflowPresets: true,
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'FlowConvert',
    NEXT_PUBLIC_APP_TAGLINE: 'Drop. Done. - Privacy First. Quality Always.',
  },
};

module.exports = nextConfig;
