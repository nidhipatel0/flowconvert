'use client';

import { Lock } from 'lucide-react';

export function PrivacyBadge() {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="rounded-xl p-6 transition-all duration-300 bg-teal-900/20 border border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/20">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Lock Icon */}
          <div className="w-12 h-12 rounded-full bg-teal-900/40 flex items-center justify-center border border-teal-500/30">
            <Lock className="w-6 h-6 text-teal-400" />
          </div>

          {/* Heading */}
          <h3 className="text-lg font-bold text-white">
            100% Private & Secure
          </h3>

          {/* Explanation Text */}
          <p className="text-sm text-teal-100 leading-relaxed max-w-md">
            All processing happens locally in your browser. Your files never leave your computer.
          </p>

          {/* Additional Privacy Features */}
          <div className="flex gap-4 mt-2 text-xs text-teal-200">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No file uploads</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No tracking</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Fully offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
