/**
 * Quality preset selector for compression
 * Shows High Quality / Balanced / Maximum Compression options
 */

'use client';

import React from 'react';
import { useCompressionStore, getEstimatedReduction } from '@/lib/stores/compression-store';
import type { CompressionQuality } from '@/lib/types/compression';

const QUALITY_OPTIONS: Array<{
  value: CompressionQuality;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'high',
    label: 'High Quality',
    description: 'Minimal compression, preserve fidelity (10-25% reduction)',
    icon: '⭐',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Recommended - best quality/size ratio (30-50% reduction)',
    icon: '⚖️',
  },
  {
    value: 'maximum',
    label: 'Maximum Compression',
    description: 'Aggressive compression, noticeable quality loss (50-80% reduction)',
    icon: '🔥',
  },
];

export function QualitySelector(): JSX.Element {
  const { qualityPreset, setQualityPreset } = useCompressionStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Quality Preset
        </h3>
      </div>

      <div className="space-y-2">
        {QUALITY_OPTIONS.map((option) => {
          const isSelected = qualityPreset === option.value;
          const reduction = getEstimatedReduction(option.value);

          return (
            <button
              key={option.value}
              onClick={() => setQualityPreset(option.value)}
              className={`
                w-full text-left p-3 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label={option.label}>
                  {option.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reduction.min}-{reduction.max}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Start with &quot;Balanced&quot; for most files. You can always adjust if needed.
        </p>
      </div>
    </div>
  );
}
