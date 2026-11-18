'use client';

import React from 'react';
import { useEditorStore } from '../../stores/editor.store';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Sliders,
  Move,
  RotateCw,
  Eye,
  Volume2,
  FastForward,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from 'lucide-react';

export function PropertiesPanel() {
  const { getSelectedClip, updateSelectedClip, deleteSelectedClip } = useEditorStore();
  const selectedClip = getSelectedClip();

  if (!selectedClip) {
    return (
      <aside className="w-72 h-full border-l border-gray-800 bg-[#0B0F17] p-5 flex flex-col items-center justify-center text-center select-none text-gray-500">
        <Sliders className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs font-semibold text-gray-400">No Clip Selected</span>
        <span className="text-[10px] text-gray-600 mt-1 max-w-[180px]">
          Click any clip on the timeline to edit its position, scale, text, or audio properties.
        </span>
      </aside>
    );
  }

  const transform = selectedClip.transform || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
  };

  const audio = selectedClip.audio || {
    volume: 1,
    muted: false,
    speed: 1,
  };

  const text = selectedClip.text;

  return (
    <aside className="w-72 h-full border-l border-gray-800 bg-[#0B0F17] flex flex-col overflow-y-auto select-none p-4 space-y-5 text-gray-200">
      {/* Clip Header with Delete */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div className="min-w-0 pr-2">
          <span className="text-xs font-bold text-white block truncate">{selectedClip.name}</span>
          <span className="text-[10px] font-mono text-gray-500 uppercase">
            {selectedClip.type} • {selectedClip.duration.toFixed(2)}s
          </span>
        </div>
        <Button
          onClick={deleteSelectedClip}
          variant="ghost"
          size="iconSm"
          title="Delete Clip (Backspace)"
          className="text-gray-500 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Settings (If Text Clip) */}
      {selectedClip.type === 'text' && text && (
        <div className="space-y-3 pb-4 border-b border-gray-800">
          <div className="text-xs font-semibold text-purple-400 flex items-center space-x-1.5">
            <Type className="w-3.5 h-3.5" />
            <span>Text Settings</span>
          </div>

          <div className="space-y-1">
            <Label>Text Content</Label>
            <textarea
              value={text.content}
              onChange={(e) =>
                updateSelectedClip({
                  text: { ...text, content: e.target.value },
                })
              }
              rows={2}
              className="w-full text-xs bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <Label>Font Size</Label>
              <span className="text-gray-400 font-mono text-[11px]">{text.fontSize}px</span>
            </div>
            <Slider
              value={[text.fontSize]}
              min={12}
              max={160}
              step={1}
              onValueChange={([val]) =>
                updateSelectedClip({
                  text: { ...text, fontSize: val },
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Text Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="color"
                  value={text.color}
                  onChange={(e) =>
                    updateSelectedClip({
                      text: { ...text, color: e.target.value },
                    })
                  }
                  className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-gray-400">{text.color}</span>
              </div>
            </div>

            <div>
              <Label>Alignment</Label>
              <div className="flex items-center space-x-1 mt-1 bg-gray-900 p-0.5 rounded border border-gray-800">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() =>
                      updateSelectedClip({
                        text: { ...text, textAlign: align },
                      })
                    }
                    className={`flex-1 py-1 flex items-center justify-center rounded text-xs transition-colors ${
                      text.textAlign === align
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {align === 'left' ? (
                      <AlignLeft className="w-3 h-3" />
                    ) : align === 'center' ? (
                      <AlignCenter className="w-3 h-3" />
                    ) : (
                      <AlignRight className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transform Settings */}
      <div className="space-y-3 pb-4 border-b border-gray-800">
        <div className="text-xs font-semibold text-blue-400 flex items-center space-x-1.5">
          <Move className="w-3.5 h-3.5" />
          <span>Transform & Position</span>
        </div>

        {/* Position X and Y */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Offset X</Label>
            <Input
              type="number"
              value={transform.x}
              onChange={(e) =>
                updateSelectedClip({
                  transform: { ...transform, x: Number(e.target.value) },
                })
              }
              className="h-7 text-xs font-mono"
            />
          </div>
          <div>
            <Label>Offset Y</Label>
            <Input
              type="number"
              value={transform.y}
              onChange={(e) =>
                updateSelectedClip({
                  transform: { ...transform, y: Number(e.target.value) },
                })
              }
              className="h-7 text-xs font-mono"
            />
          </div>
        </div>

        {/* Scale Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <Label>Scale (Zoom)</Label>
            <span className="text-gray-400 font-mono text-[11px]">
              {(transform.scale * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[transform.scale]}
            min={0.1}
            max={3.0}
            step={0.05}
            onValueChange={([val]) =>
              updateSelectedClip({
                transform: { ...transform, scale: val },
              })
            }
          />
        </div>

        {/* Rotation Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <Label>Rotation</Label>
            <span className="text-gray-400 font-mono text-[11px]">{transform.rotation}°</span>
          </div>
          <Slider
            value={[transform.rotation]}
            min={-180}
            max={180}
            step={1}
            onValueChange={([val]) =>
              updateSelectedClip({
                transform: { ...transform, rotation: val },
              })
            }
          />
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <Label>Opacity</Label>
            <span className="text-gray-400 font-mono text-[11px]">
              {(transform.opacity * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[transform.opacity]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([val]) =>
              updateSelectedClip({
                transform: { ...transform, opacity: val },
              })
            }
          />
        </div>
      </div>

      {/* Audio Settings */}
      <div className="space-y-3 pb-4">
        <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio & Speed</span>
        </div>

        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <Label>Volume</Label>
            <span className="text-gray-400 font-mono text-[11px]">
              {(audio.volume * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[audio.volume]}
            min={0}
            max={2}
            step={0.05}
            onValueChange={([val]) =>
              updateSelectedClip({
                audio: { ...audio, volume: val },
              })
            }
          />
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <Label>Speed Multiplier</Label>
            <span className="text-gray-400 font-mono text-[11px]">{audio.speed}x</span>
          </div>
          <Slider
            value={[audio.speed]}
            min={0.25}
            max={4.0}
            step={0.25}
            onValueChange={([val]) =>
              updateSelectedClip({
                audio: { ...audio, speed: val },
              })
            }
          />
        </div>
      </div>
    </aside>
  );
}

