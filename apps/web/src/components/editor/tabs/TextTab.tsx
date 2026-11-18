'use client';

import React from 'react';
import { Type, Sparkles, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { useEditorStore } from '../../../stores/editor.store';
import { AddClipCommand } from '@ai-video-studio/timeline-engine';
import { uuidv4 } from '../../../lib/uuid';

const TEXT_PRESETS = [
  {
    name: 'Bold Heading',
    content: 'MAIN TITLE',
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    align: 'center',
    desc: 'High-contrast centered title',
  },
  {
    name: 'Social Hook',
    content: 'WAIT FOR THE END 🔥',
    fontSize: 48,
    fontWeight: '800',
    color: '#FFE600',
    backgroundColor: '#000000',
    align: 'center',
    desc: 'Viral yellow punchy banner',
  },
  {
    name: 'Neon Glow',
    content: 'NEON CYBER',
    fontSize: 52,
    fontWeight: '800',
    color: '#00F0FF',
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    align: 'center',
    desc: 'Futuristic cyan heading',
  },
  {
    name: 'Lower Third',
    content: 'Speaker Name | Host',
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    align: 'left',
    desc: 'Professional speaker banner',
  },
  {
    name: 'Subtitle Caption',
    content: 'Type your subtitle caption here',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)',
    align: 'center',
    desc: 'Standard centered closed caption',
  },
];

export function TextTab() {
  const { timeline, dispatchCommand, currentTime } = useEditorStore();

  const handleAddPreset = (preset: typeof TEXT_PRESETS[0]) => {
    if (!timeline) return;

    // Find or target text track
    const textTrack =
      timeline.tracks.find((t) => t.type === 'text' && !t.isLocked) ||
      timeline.tracks[0];

    if (!textTrack) return;

    const clipId = uuidv4();
    const newClip = {
      id: clipId,
      trackId: textTrack.id,
      name: `Text: ${preset.content.slice(0, 12)}`,
      type: 'text' as const,
      start: currentTime || 0,
      duration: 4,
      sourceStart: 0,
      transform: {
        x: 0,
        y: preset.name === 'Lower Third' ? 350 : 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: 10,
      },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
      text: {
        content: preset.content,
        fontFamily: 'Inter, sans-serif',
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight as any,
        fontStyle: 'normal' as const,
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        textAlign: preset.align as any,
        letterSpacing: 0,
        lineHeight: 1.2,
        strokeWidth: 0,
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        padding: 12,
        borderRadius: 6,
      },
      effects: [],
    };

    dispatchCommand(new AddClipCommand(textTrack.id, newClip));
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
        <Type className="w-4 h-4 text-purple-400" />
        <span>Text & Title Presets</span>
      </div>

      <div className="space-y-2.5">
        {TEXT_PRESETS.map((preset) => (
          <div
            key={preset.name}
            onClick={() => handleAddPreset(preset)}
            className="group p-3 rounded-lg bg-gray-900/90 border border-gray-800 hover:border-purple-500/60 hover:bg-gray-800/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-gray-200 group-hover:text-purple-300">
                {preset.name}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{preset.desc}</div>
              <div
                className="mt-2 text-xs px-2 py-1 rounded inline-block font-mono"
                style={{
                  backgroundColor: preset.backgroundColor,
                  color: preset.color,
                }}
              >
                {preset.content}
              </div>
            </div>

            <Button
              size="iconSm"
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
