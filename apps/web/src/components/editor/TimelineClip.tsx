'use client';

import React, { useRef, useState } from 'react';
import { Clip } from '@ai-video-studio/video-schema';
import { useEditorStore } from '../../stores/editor.store';
import { MoveClipCommand, TrimClipCommand } from '@ai-video-studio/timeline-engine';
import { Film, Music, Type, Sparkles } from 'lucide-react';

interface TimelineClipProps {
  clip: Clip;
  trackId: string;
  zoom: number; // pixels per second
  isLocked: boolean;
}

export function TimelineClip({ clip, trackId, zoom, isLocked }: TimelineClipProps) {
  const { selectedClipId, selectClip, dispatchCommand } = useEditorStore();
  const isSelected = selectedClipId === clip.id;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const clipStartRef = useRef(0);

  const left = clip.start * zoom;
  const width = Math.max(clip.duration * zoom, 14);

  // Background colors per clip type
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    video: {
      bg: 'bg-blue-950/80',
      border: isSelected ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-blue-600/70',
      text: 'text-blue-200',
    },
    audio: {
      bg: 'bg-emerald-950/80',
      border: isSelected ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-emerald-600/70',
      text: 'text-emerald-200',
    },
    text: {
      bg: 'bg-purple-950/80',
      border: isSelected ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-purple-600/70',
      text: 'text-purple-200',
    },
    image: {
      bg: 'bg-indigo-950/80',
      border: isSelected ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-indigo-600/70',
      text: 'text-indigo-200',
    },
  };

  const currentTheme = colorMap[clip.type] || colorMap.video;

  // Handle Drag to Move along timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    selectClip(clip.id, trackId);

    dragStartXRef.current = e.clientX;
    clipStartRef.current = clip.start;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const deltaSeconds = deltaX / zoom;
      const proposedStart = Math.max(0, clipStartRef.current + deltaSeconds);

      // Optimistic update position
      const elem = document.getElementById(`clip-${clip.id}`);
      if (elem) {
        elem.style.left = `${proposedStart * zoom}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);

      const deltaX = upEvent.clientX - dragStartXRef.current;
      const deltaSeconds = deltaX / zoom;
      const finalStart = Math.max(0, Math.round((clipStartRef.current + deltaSeconds) * 100) / 100);

      if (Math.abs(finalStart - clip.start) > 0.02) {
        dispatchCommand(new MoveClipCommand(clip.id, trackId, finalStart));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Trim Left (In-Point)
  const handleTrimLeft = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = clip.start;
    const initialDuration = clip.duration;
    const initialSourceStart = clip.sourceStart;

    const onMove = (moveEvt: MouseEvent) => {
      const deltaSeconds = (moveEvt.clientX - startX) / zoom;
      const newStart = Math.max(0, initialStart + deltaSeconds);
      const newDuration = Math.max(0.1, initialDuration - deltaSeconds);
      const elem = document.getElementById(`clip-${clip.id}`);
      if (elem) {
        elem.style.left = `${newStart * zoom}px`;
        elem.style.width = `${newDuration * zoom}px`;
      }
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const deltaSeconds = (upEvt.clientX - startX) / zoom;
      const newStart = Math.max(0, Math.round((initialStart + deltaSeconds) * 100) / 100);
      const newDuration = Math.max(0.1, Math.round((initialDuration - deltaSeconds) * 100) / 100);
      const newSourceStart = Math.max(0, Math.round((initialSourceStart + deltaSeconds) * 100) / 100);

      dispatchCommand(new TrimClipCommand(clip.id, newStart, newDuration, newSourceStart));
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Handle Trim Right (Out-Point)
  const handleTrimRight = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = clip.duration;

    const onMove = (moveEvt: MouseEvent) => {
      const deltaSeconds = (moveEvt.clientX - startX) / zoom;
      const newDuration = Math.max(0.1, initialDuration + deltaSeconds);
      const elem = document.getElementById(`clip-${clip.id}`);
      if (elem) {
        elem.style.width = `${newDuration * zoom}px`;
      }
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const deltaSeconds = (upEvt.clientX - startX) / zoom;
      const newDuration = Math.max(0.1, Math.round((initialDuration + deltaSeconds) * 100) / 100);

      dispatchCommand(new TrimClipCommand(clip.id, clip.start, newDuration, clip.sourceStart));
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      id={`clip-${clip.id}`}
      onMouseDown={handleMouseDown}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      className={`absolute top-1 bottom-1 rounded-md border ${currentTheme.border} ${currentTheme.bg} overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-between px-1.5 shadow-md z-10 transition-shadow ${
        isDragging ? 'opacity-85 shadow-xl' : ''
      }`}
    >
      {/* Left Trim Handle */}
      {!isLocked && (
        <div
          onMouseDown={handleTrimLeft}
          className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-white/80 rounded"></div>
        </div>
      )}

      {/* Clip Content & Title */}
      <div className="flex items-center space-x-1.5 min-w-0 pointer-events-none pl-1">
        {clip.type === 'video' && <Film className="w-3 h-3 text-blue-400 shrink-0" />}
        {clip.type === 'audio' && <Music className="w-3 h-3 text-emerald-400 shrink-0" />}
        {clip.type === 'text' && <Type className="w-3 h-3 text-purple-400 shrink-0" />}

        <span className={`text-[10px] font-semibold truncate ${currentTheme.text}`}>
          {clip.name}
        </span>
        <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">
          {clip.duration.toFixed(1)}s
        </span>
      </div>

      {/* Right Trim Handle */}
      {!isLocked && (
        <div
          onMouseDown={handleTrimRight}
          className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-white/60 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-20"
        >
          <div className="w-0.5 h-3 bg-white/80 rounded"></div>
        </div>
      )}
    </div>
  );
}

