'use client';

import React from 'react';
import { Sliders, Sun, Contrast, Eye, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../../stores/editor.store';
import { EffectType } from '@ai-video-studio/video-schema';
import { uuidv4 } from '../../../lib/uuid';

const EFFECTS: { type: EffectType; label: string; defaultValue: number }[] = [
  { type: 'brightness', label: 'Brighten (+20%)', defaultValue: 1.2 },
  { type: 'contrast', label: 'High Contrast', defaultValue: 1.3 },
  { type: 'saturation', label: 'Vibrant Colors', defaultValue: 1.4 },
  { type: 'grayscale', label: 'Black & White', defaultValue: 1 },
  { type: 'sepia', label: 'Vintage Warm', defaultValue: 0.8 },
  { type: 'blur', label: 'Soft Focus', defaultValue: 4 },
];

export function EffectsTab() {
  const { getSelectedClip, updateSelectedClip } = useEditorStore();
  const selectedClip = getSelectedClip();

  const handleApplyEffect = (effType: EffectType, defaultVal: number) => {
    if (!selectedClip) return;

    const existing = selectedClip.effects || [];
    const filtered = existing.filter((e) => e.type !== effType);

    updateSelectedClip({
      effects: [
        ...filtered,
        {
          id: uuidv4(),
          type: effType,
          value: defaultVal,
          enabled: true,
        },
      ],
    });
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
        <Sparkles className="w-4 h-4 text-pink-400" />
        <span>Video Effects & Filters</span>
      </div>

      {!selectedClip && (
        <div className="text-[11px] text-pink-400/90 bg-pink-500/10 border border-pink-500/20 p-2.5 rounded-lg">
          Select a video or image clip on the timeline to apply visual effects.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {EFFECTS.map((eff) => {
          const isActive = selectedClip?.effects?.some((e) => e.type === eff.type);
          return (
            <div
              key={eff.type}
              onClick={() => handleApplyEffect(eff.type, eff.defaultValue)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                isActive
                  ? 'border-pink-500 bg-pink-500/20 text-white'
                  : 'border-gray-800 bg-gray-900/80 text-gray-300 hover:border-gray-700 hover:bg-gray-800'
              }`}
            >
              <div className="w-7 h-7 rounded bg-gray-800 flex items-center justify-center text-pink-400 mb-2">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold truncate">{eff.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
