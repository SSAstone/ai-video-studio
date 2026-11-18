'use client';

import React, { useRef } from 'react';
import { formatTimecode } from '@ai-video-studio/timeline-engine';

interface TimelinePlayheadProps {
  currentTime: number;
  zoom: number;
  duration: number;
  fps: number;
  onSeek: (time: number) => void;
}

export function TimelinePlayhead({
  currentTime,
  zoom,
  duration,
  fps,
  onSeek,
}: TimelinePlayheadProps) {
  const left = currentTime * zoom;
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const trackCanvas = document.getElementById('timeline-tracks-canvas');
      if (!trackCanvas) return;

      const rect = trackCanvas.getBoundingClientRect();
      const clickX = moveEvt.clientX - rect.left;
      const newTime = Math.max(0, Math.min(clickX / zoom, duration));
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{ left: `${left}px` }}
      className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
    >
      {/* Top Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-sm cursor-ew-resize pointer-events-auto flex items-center justify-center shadow-lg transform rotate-45 border border-white/50"
      />

      {/* Vertical Red Playhead Line */}
      <div className="w-0.5 h-full bg-red-500 shadow-sm shadow-red-500/50" />
    </div>
  );
}

