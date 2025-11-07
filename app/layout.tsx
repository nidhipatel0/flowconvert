import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'FlowConvert - Universal File Editor',
    template: '%s | FlowConvert',
  },
  description:
    'Drop. Done. - Privacy First. Quality Always. Convert, compress, resize, and edit files instantly in your browser.',
  keywords: [
    'file converter',
    'image editor',
    'PDF tools',
    'file compression',
    'privacy-first',
    'client-side processing',
  ],
  authors: [{ name: 'FlowConvert Team' }],
  creator: 'FlowConvert',
  publisher: 'FlowConvert',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flowconvert.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flowconvert.com',
    siteName: 'FlowConvert',
    title: 'FlowConvert - Universal File Editor',
    description:
      'Privacy-first file conversion and editing. Drop. Done.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowConvert',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowConvert - Universal File Editor',
    description:
      'Privacy-first file conversion and editing. Drop. Done.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    google: '',
    yandex: '',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-secondary-50 antialiased">
        {/* Main content */}
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>

        {/* Toast notifications container */}
        <div id="toast-container" aria-live="polite" aria-atomic="true" />

        {/* Modal container */}
        <div id="modal-container" />
      </body>
    </html>
  );
}
