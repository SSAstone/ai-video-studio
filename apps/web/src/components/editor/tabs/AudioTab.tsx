'use client';

import React from 'react';
import { Music, Volume2, Plus, Sparkles } from 'lucide-react';
import { Button } from '../../ui/button';
import { useEditorStore } from '../../../stores/editor.store';
import { AddClipCommand } from '@ai-video-studio/timeline-engine';
import { uuidv4 } from '../../../lib/uuid';

const AUDIO_PRESETS = [
  {
    name: 'Lo-Fi Chill Beat',
    category: 'Background Music',
    duration: 30,
    bpm: 85,
  },
  {
    name: 'Upbeat Vlog Pop',
    category: 'Background Music',
    duration: 25,
    bpm: 120,
  },
  {
    name: 'Cinematic Ambient Drone',
    category: 'Soundscape',
    duration: 40,
    bpm: 60,
  },
  {
    name: 'Punchy Transition Whoosh',
    category: 'Sound Effect',
    duration: 1.5,
    bpm: 0,
  },
  {
    name: 'Mouse Click / Camera Shutter',
    category: 'Sound Effect',
    duration: 0.8,
    bpm: 0,
  },
];

export function AudioTab() {
  const { timeline, dispatchCommand, currentTime } = useEditorStore();

  const handleAddAudio = (item: typeof AUDIO_PRESETS[0]) => {
    if (!timeline) return;

    const audioTrack =
      timeline.tracks.find((t) => t.type === 'audio' && !t.isLocked) ||
      timeline.tracks[0];

    if (!audioTrack) return;

    const clipId = uuidv4();
    const newClip = {
      id: clipId,
      trackId: audioTrack.id,
      name: item.name,
      type: 'audio' as const,
      start: currentTime || 0,
      duration: item.duration,
      sourceStart: 0,
      sourceDuration: item.duration,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 0 },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0.5, fadeOutDuration: 0.5, pan: 0 },
      effects: [],
    };

    dispatchCommand(new AddClipCommand(audioTrack.id, newClip));
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-3 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
        <Music className="w-4 h-4 text-emerald-400" />
        <span>Audio & Sound Effects</span>
      </div>

      <div className="space-y-2">
        {AUDIO_PRESETS.map((item) => (
          <div
            key={item.name}
            onClick={() => handleAddAudio(item)}
            className="group p-2.5 rounded-lg bg-gray-900/90 border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-200 group-hover:text-emerald-300 truncate max-w-[150px]">
                  {item.name}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {item.category} • {item.duration}s
                </div>
              </div>
            </div>

            <Button
              size="iconSm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
