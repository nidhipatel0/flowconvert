/**
 * Compression progress indicator
 * Shows current step and progress percentage
 */

'use client';

import React from 'react';
import { useCompressionStore } from '@/lib/stores/compression-store';

export function CompressionProgress(): JSX.Element | null {
  const { progress, status } = useCompressionStore();

  if (!progress || status === 'idle') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
        return '🔍';
      case 'compressing':
        return '⚙️';
      case 'finalizing':
        return '✨';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'error':
        return 'text-destructive';
      case 'complete':
        return 'text-green-500';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="w-full p-4 bg-card border border-border rounded-lg shadow-sm">
      {/* Status header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={status}>
            {getStatusIcon()}
          </span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {progress.message}
          </span>
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {progress.progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${
            status === 'error' ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Current step (if available) */}
      {progress.currentStep && (
        <div className="mt-3 text-xs text-muted-foreground">
          {progress.currentStep}
        </div>
      )}

      {/* Estimated time remaining */}
      {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          ⏱️ Est. {Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining
        </div>
      )}
    </div>
  );
}
