'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { useEditorStore } from '../../stores/editor.store';
import { AspectRatioPreset, AspectRatioType } from '@ai-video-studio/video-schema';

interface TopToolbarProps {
  onExportClick: () => void;
}

export function TopToolbar({ onExportClick }: TopToolbarProps) {
  const {
    projectName,
    timeline,
    saveStatus,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    saveTimeline,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(projectName);

  const handleSaveClick = () => {
    saveTimeline('Manual user save');
  };

  return (
    <header className="h-12 border-b border-gray-800 bg-[#0B0F17] px-4 flex items-center justify-between select-none z-30">
      {/* Left: Back & Project Title */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Film className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight max-w-[200px] truncate">
            {projectName || 'Untitled Project'}
          </span>
        </div>

        {/* Save Status Badge */}
        <div className="flex items-center space-x-1 pl-2 border-l border-gray-800">
          {saveStatus === 'saved' && (
            <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center space-x-1 text-[11px] text-blue-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span className="hidden sm:inline">Saving...</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <button
              onClick={handleSaveClick}
              className="flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              title="Click to save now (Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unsaved</span>
            </button>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center space-x-1 text-[11px] text-red-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Undo / Redo & Zoom Controls */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={undo}
          disabled={!canUndo}
          variant="ghost"
          size="iconSm"
          title="Undo (Cmd+Z)"
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={redo}
          disabled={!canRedo}
          variant="ghost"
          size="iconSm"
          title="Redo (Cmd+Shift+Z)"
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="h-4 w-px bg-gray-800 mx-1" />

        <div className="hidden md:flex items-center space-x-2 w-32">
          <ZoomOut
            className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-gray-300"
            onClick={() => setZoom(zoom - 15)}
          />
          <Slider
            value={[zoom]}
            min={15}
            max={200}
            step={5}
            onValueChange={([val]) => setZoom(val)}
            className="w-20"
          />
          <ZoomIn
            className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-gray-300"
            onClick={() => setZoom(zoom + 15)}
          />
        </div>
      </div>

      {/* Right: Aspect Ratio Info & Export Button */}
      <div className="flex items-center space-x-3">
        {timeline && (
          <span className="text-[11px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 hidden lg:inline">
            {timeline.width}×{timeline.height} • {timeline.fps}fps
          </span>
        )}

        <Button
          onClick={onExportClick}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-7 px-3.5 shadow-md shadow-blue-600/30 flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MP4</span>
        </Button>
      </div>
    </header>
  );
}

