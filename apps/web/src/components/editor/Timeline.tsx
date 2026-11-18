'use client';

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editor.store';
import { TimelineRuler } from './TimelineRuler';
import { TimelinePlayhead } from './TimelinePlayhead';
import { TimelineTrack } from './TimelineTrack';
import { Button } from '../ui/button';
import { Scissors, Trash2, Plus, Undo2, Redo2, Layers } from 'lucide-react';
import { AddTrackCommand } from '@ai-video-studio/timeline-engine';
import { uuidv4 } from '../../lib/uuid';

export function Timeline() {
  const {
    timeline,
    currentTime,
    setCurrentTime,
    zoom,
    splitClipAtPlayhead,
    deleteSelectedClip,
    selectedClipId,
    dispatchCommand,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useEditorStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcuts for timeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 'S' -> Split clip at playhead
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        splitClipAtPlayhead();
      }

      // 'Backspace' or 'Delete' -> Delete selected clip
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelectedClip();
      }

      // 'Cmd+Z' / 'Ctrl+Z' -> Undo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // 'Cmd+Shift+Z' / 'Ctrl+Y' -> Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [splitClipAtPlayhead, deleteSelectedClip, undo, redo]);

  if (!timeline) return null;

  const duration = timeline.duration || 30;
  const fps = timeline.fps || 30;
  const totalTrackWidth = Math.max(duration * zoom, 1200);

  const handleAddTrack = (type: 'video' | 'audio' | 'text') => {
    const trackId = uuidv4();
    const newTrack = {
      id: trackId,
      type,
      name: `${type.toUpperCase()} ${timeline.tracks.filter((t) => t.type === type).length + 1}`,
      index: timeline.tracks.length,
      isLocked: false,
      isMuted: false,
      isVisible: true,
      clips: [],
    };
    dispatchCommand(new AddTrackCommand(newTrack));
  };

  return (
    <div className="h-64 border-t border-gray-800 bg-[#0B0F17] flex flex-col select-none z-20">
      {/* Timeline Action Header */}
      <div className="h-9 border-b border-gray-800 bg-gray-950 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Split at playhead */}
          <Button
            onClick={splitClipAtPlayhead}
            variant="editor"
            size="sm"
            title="Split Clip at Playhead (S)"
            className="h-7 text-xs px-2.5 flex items-center space-x-1"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Split (S)</span>
          </Button>

          {/* Delete clip */}
          <Button
            onClick={deleteSelectedClip}
            disabled={!selectedClipId}
            variant="editor"
            size="sm"
            title="Delete Selected Clip (Backspace)"
            className="h-7 text-xs px-2.5 flex items-center space-x-1 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Delete</span>
          </Button>

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {/* Add Track Menu */}
          <Button
            onClick={() => handleAddTrack('video')}
            variant="editor"
            size="sm"
            className="h-7 text-[11px] px-2 text-gray-300"
          >
            <Plus className="w-3 h-3 mr-1 text-blue-400" />
            + Video Track
          </Button>

          <Button
            onClick={() => handleAddTrack('audio')}
            variant="editor"
            size="sm"
            className="h-7 text-[11px] px-2 text-gray-300"
          >
            <Plus className="w-3 h-3 mr-1 text-emerald-400" />
            + Audio Track
          </Button>

          <Button
            onClick={() => handleAddTrack('text')}
            variant="editor"
            size="sm"
            className="h-7 text-[11px] px-2 text-gray-300"
          >
            <Plus className="w-3 h-3 mr-1 text-purple-400" />
            + Text Track
          </Button>
        </div>

        <div className="text-[11px] font-mono text-gray-400">
          Duration: <span className="text-white font-semibold">{duration}s</span>
        </div>
      </div>

      {/* Timeline Scrollable Track Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex flex-col min-w-max">
          {/* Header Row & Ruler */}
          <div className="flex sticky top-0 z-30">
            {/* Corner Spacer */}
            <div className="w-48 h-7 bg-[#131B2D] border-r border-b border-gray-800 shrink-0 flex items-center px-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Tracks
              </span>
            </div>

            {/* Ruler Canvas */}
            <TimelineRuler
              duration={duration}
              zoom={zoom}
              fps={fps}
              onSeek={(time) => setCurrentTime(time)}
            />
          </div>

          {/* Tracks Canvas with Playhead */}
          <div id="timeline-tracks-canvas" className="relative flex-1">
            {/* Playhead Overlay */}
            <div className="absolute top-0 bottom-0 left-48 right-0 pointer-events-none">
              <TimelinePlayhead
                currentTime={currentTime}
                zoom={zoom}
                duration={duration}
                fps={fps}
                onSeek={(time) => setCurrentTime(time)}
              />
            </div>

            {/* Individual Tracks */}
            {timeline.tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                zoom={zoom}
                totalWidth={totalTrackWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
