'use client';

import React from 'react';
import Link from 'next/link';
import { Play, MoreVertical, Copy, Trash2, Edit3, Film, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatTimecode } from '@ai-video-studio/timeline-engine';

export interface ProjectCardItem {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  thumbnailUrl?: string | null;
  updatedAt: string;
}

interface ProjectGridProps {
  projects: ProjectCardItem[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function ProjectGrid({ projects, onDuplicate, onDelete, onRename }: ProjectGridProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {projects.map((project) => {
        const isPortrait = project.height > project.width;
        const formattedDuration = formatTimecode(project.duration || 30, project.fps || 30, false);

        return (
          <div
            key={project.id}
            className="group relative bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 flex flex-col"
          >
            {/* Thumbnail Canvas Area */}
            <Link
              href={`/editor/${project.id}`}
              className="relative aspect-video w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-600 group-hover:text-blue-400 transition-colors">
                  <Film className="w-10 h-10 mb-1 opacity-70 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] tracking-wider font-mono uppercase text-gray-500">
                    {project.width} × {project.height}
                  </span>
                </div>
              )}

              {/* Play Overlay On Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 transform group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-gray-200 text-[11px] font-mono px-2 py-0.5 rounded border border-white/10 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>{formattedDuration}</span>
              </div>

              {/* Aspect Ratio Tag */}
              <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-sm text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-700">
                {isPortrait ? '9:16' : '16:9'}
              </div>
            </Link>

            {/* Details Area */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <Link
                  href={`/editor/${project.id}`}
                  className="block text-sm font-semibold text-gray-100 truncate hover:text-blue-400 transition-colors"
                >
                  {project.name}
                </Link>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Edited {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    onDuplicate(project.id);
                  }}
                  variant="ghost"
                  size="iconSm"
                  title="Duplicate Project"
                  className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(project.id);
                  }}
                  variant="ghost"
                  size="iconSm"
                  title="Delete Project"
                  className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

