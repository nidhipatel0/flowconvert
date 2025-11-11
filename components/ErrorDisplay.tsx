'use client';

import { useEditorStore } from '@/lib/stores';
import { useEffect } from 'react';

export function ErrorDisplay() {
  const lastError = useEditorStore((state) => state.lastError);
  const setError = useEditorStore((state) => state.setError);

  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [lastError, setError]);

  if (!lastError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in">
      <div className="glass-card rounded-xl p-4 max-w-md border-l-4 border-red-500 shadow-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{lastError}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
