'use client';

import React from 'react';
import { Sparkles, Blend, Layers, ArrowRightLeft } from 'lucide-react';
import { useEditorStore } from '../../../stores/editor.store';
import { TransitionType } from '@ai-video-studio/video-schema';
import { uuidv4 } from '../../../lib/uuid';

const TRANSITIONS: { type: TransitionType; label: string; desc: string }[] = [
  { type: 'crossfade', label: 'Crossfade', desc: 'Smooth opacity dissolve between clips' },
  { type: 'fade', label: 'Fade to Black', desc: 'Dips to black then reveals next clip' },
  { type: 'wipe_left', label: 'Wipe Left', desc: 'Horizontal sliding wipe transition' },
  { type: 'wipe_right', label: 'Wipe Right', desc: 'Horizontal right wipe transition' },
  { type: 'zoom_in', label: 'Zoom In', desc: 'Dynamic focal zoom push into scene' },
  { type: 'dissolve', label: 'Film Dissolve', desc: 'Classic cinematic dissolve' },
];

export function TransitionsTab() {
  const { getSelectedClip, updateSelectedClip } = useEditorStore();
  const selectedClip = getSelectedClip();

  const handleApplyTransition = (transType: TransitionType) => {
    if (!selectedClip) return;

    updateSelectedClip({
      transitionIn: {
        id: uuidv4(),
        type: transType,
        duration: 0.5,
      },
    });
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
        <ArrowRightLeft className="w-4 h-4 text-amber-400" />
        <span>Transitions</span>
      </div>

      {!selectedClip && (
        <div className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          Select a clip on the timeline first, then click a transition below to apply it.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map((t) => (
          <div
            key={t.type}
            onClick={() => handleApplyTransition(t.type)}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${selectedClip?.transitionIn?.type === t.type
                ? 'border-amber-500 bg-amber-500/20 text-white'
                : 'border-gray-800 bg-gray-900/80 text-gray-300 hover:border-gray-700 hover:bg-gray-800'
              }`}
          >
            <div className="w-7 h-7 rounded bg-gray-800 flex items-center justify-center text-amber-400 mb-2">
              <Blend className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold truncate">{t.label}</div>
            <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}