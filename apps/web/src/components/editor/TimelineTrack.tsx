'use client';

import React from 'react';
import { Track } from '@ai-video-studio/video-schema';
import { TimelineClip } from './TimelineClip';
import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, Film, Music, Type } from 'lucide-react';
import { useEditorStore } from '../../stores/editor.store';

interface TimelineTrackProps {
  track: Track;
  zoom: number;
  totalWidth: number;
}

export function TimelineTrack({ track, zoom, totalWidth }: TimelineTrackProps) {
  const { timeline, saveTimeline } = useEditorStore();

  const handleToggleVisibility = () => {
    if (!timeline) return;
    track.isVisible = !track.isVisible;
    saveTimeline('Toggle track visibility');
  };

  const handleToggleMute = () => {
    if (!timeline) return;
    track.isMuted = !track.isMuted;
    saveTimeline('Toggle track mute');
  };

  const handleToggleLock = () => {
    if (!timeline) return;
    track.isLocked = !track.isLocked;
    saveTimeline('Toggle track lock');
  };

  const getTrackIcon = () => {
    if (track.type === 'video') return <Film className="w-3.5 h-3.5 text-blue-400" />;
    if (track.type === 'audio') return <Music className="w-3.5 h-3.5 text-emerald-400" />;
    return <Type className="w-3.5 h-3.5 text-purple-400" />;
  };

  return (
    <div className="flex h-11 border-b border-gray-800/80 bg-[#0E1524]/60 relative select-none">
      {/* Track Header (Fixed Left) */}
      <div className="w-48 h-full bg-[#131B2D] border-r border-gray-800 flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center space-x-2 min-w-0">
          {getTrackIcon()}
          <span className="text-xs font-semibold text-gray-300 truncate">{track.name}</span>
        </div>

        {/* Track Controls */}
        <div className="flex items-center space-x-1 text-gray-500">
          <button
            onClick={handleToggleVisibility}
            className={`p-1 rounded hover:text-white ${
              !track.isVisible ? 'text-amber-400' : 'hover:bg-gray-800'
            }`}
            title={track.isVisible ? 'Hide Track' : 'Show Track'}
          >
            {track.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-1 rounded hover:text-white ${
              track.isMuted ? 'text-red-400' : 'hover:bg-gray-800'
            }`}
            title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
          >
            {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>

          <button
            onClick={handleToggleLock}
            className={`p-1 rounded hover:text-white ${
              track.isLocked ? 'text-blue-400' : 'hover:bg-gray-800'
            }`}
            title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
          >
            {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Track Lane (Clips Canvas) */}
      <div
        className="relative h-full overflow-hidden"
        style={{ width: `${totalWidth}px` }}
      >
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            trackId={track.id}
            zoom={zoom}
            isLocked={track.isLocked}
          />
        ))}
      </div>
    </div>
  );
}

