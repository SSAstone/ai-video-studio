'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AspectRatioPreset, AspectRatioType } from '@ai-video-studio/video-schema';
import { Smartphone, Monitor, Square, Tv, Clapperboard, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: any) => void;
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  LANDSCAPE_16_9: <Monitor className="w-5 h-5" />,
  PORTRAIT_9_16: <Smartphone className="w-5 h-5" />,
  SQUARE_1_1: <Square className="w-5 h-5" />,
  VERTICAL_4_5: <Smartphone className="w-5 h-5" />,
  CINEMA_21_9: <Tv className="w-5 h-5" />,
};

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter();
  const { workspace } = useAuthStore();
  const [name, setName] = useState('My Awesome Video');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('LANDSCAPE_16_9');
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const workspaceId = workspace?.id || 'default-workspace';
      const { data } = await api.post('/projects', {
        workspaceId,
        name,
        aspectRatio,
        duration,
      });

      if (data.success && data.data) {
        onClose();
        if (onProjectCreated) {
          onProjectCreated(data.data);
        }
        router.push(`/editor/${data.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <Clapperboard className="w-5 h-5 text-blue-500" />
            <span>Create New Video Project</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Choose your canvas aspect ratio and project settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Title</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Vacation Reel"
              required
              className="bg-gray-800/80 border-gray-700 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio & Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(AspectRatioPreset) as AspectRatioType[]).map((key) => {
                const preset = AspectRatioPreset[key];
                const isSelected = aspectRatio === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setAspectRatio(key)}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/15 text-white ring-1 ring-blue-500'
                        : 'border-gray-800 bg-gray-800/40 text-gray-300 hover:border-gray-700 hover:bg-gray-800/80'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md mr-2.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {PRESET_ICONS[key] || <Monitor className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{preset.label.split(' ')[0]}</div>
                      <div className="text-[10px] text-gray-400">
                        {preset.width} × {preset.height}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="duration">Initial Duration</Label>
              <span className="text-xs font-mono text-blue-400">{duration} seconds</span>
            </div>
            <Input
              id="duration"
              type="number"
              min={5}
              max={3600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-gray-800/80 border-gray-700 text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/30"
            >
              {isSubmitting ? 'Creating...' : 'Open in Editor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

