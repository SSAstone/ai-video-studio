'use client';

import React from 'react';
import { formatTimecode } from '@ai-video-studio/timeline-engine';

interface TimelineRulerProps {
  duration: number;
  zoom: number; // pixels per second
  fps: number;
  onSeek: (time: number) => void;
}

export function TimelineRuler({ duration, zoom, fps, onSeek }: TimelineRulerProps) {
  // Determine interval step based on zoom
  let stepSeconds = 1;
  if (zoom < 30) stepSeconds = 5;
  if (zoom < 15) stepSeconds = 10;
  if (zoom > 100) stepSeconds = 0.5;

  const totalWidth = Math.max(duration * zoom, 1200);
  const numSteps = Math.ceil(duration / stepSeconds);
  const steps: number[] = [];
  for (let i = 0; i <= numSteps; i++) {
    steps.push(i * stepSeconds);
  }

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = Math.max(0, Math.min(clickX / zoom, duration));
    onSeek(seekTime);
  };

  return (
    <div
      onClick={handleRulerClick}
      className="h-7 bg-[#101726] border-b border-gray-800 relative cursor-pointer select-none overflow-hidden"
      style={{ width: `${totalWidth}px` }}
    >
      {steps.map((second) => {
        const left = second * zoom;
        const isMajor = second % (stepSeconds * 5) === 0;

        return (
          <div
            key={second}
            className="absolute top-0 bottom-0 flex flex-col justify-between"
            style={{ left: `${left}px` }}
          >
            <span
              className={`text-[9px] font-mono pl-1 ${
                isMajor ? 'text-gray-300 font-semibold' : 'text-gray-500'
              }`}
            >
              {formatTimecode(second, fps, false)}
            </span>
            <div
              className={`w-px ${isMajor ? 'h-3 bg-gray-600' : 'h-1.5 bg-gray-700'}`}
            />
          </div>
        );
      })}
    </div>
  );
}

