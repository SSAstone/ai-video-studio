'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Download, Film, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';
import { useEditorStore } from '../../stores/editor.store';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { ExportFormat, ExportResolution, SocketEvents } from '@ai-video-studio/shared-types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { projectId, projectName, timeline } = useEditorStore();
  const { workspace } = useAuthStore();

  const [resolution, setResolution] = useState<ExportResolution>(ExportResolution.RES_1080P);
  const [fps, setFps] = useState(30);
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.MP4);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to WebSocket render progress
  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();

    socket.emit(SocketEvents.JOIN_PROJECT, { projectId });

    socket.on(SocketEvents.RENDER_PROGRESS, (data: any) => {
      if (data.jobId === currentJobId) {
        setRenderProgress(data.progress);
      }
    });

    socket.on(SocketEvents.RENDER_COMPLETED, (data: any) => {
      if (data.jobId === currentJobId) {
        setRenderProgress(100);
        setIsRendering(false);
        setOutputUrl(data.outputUrl);
      }
    });

    return () => {
      socket.off(SocketEvents.RENDER_PROGRESS);
      socket.off(SocketEvents.RENDER_COMPLETED);
    };
  }, [projectId, currentJobId]);

  const handleStartExport = async () => {
    if (!projectId || !workspace?.id || !timeline) return;

    setIsRendering(true);
    setRenderProgress(0);
    setOutputUrl(null);
    setErrorMessage(null);

    const width = resolution === ExportResolution.RES_4K ? 3840 : resolution === ExportResolution.RES_720P ? 1280 : 1920;
    const height = resolution === ExportResolution.RES_4K ? 2160 : resolution === ExportResolution.RES_720P ? 720 : 1080;

    try {
      const { data } = await api.post(`/render/projects/${projectId}`, {
        workspaceId: workspace.id,
        options: {
          format,
          resolution,
          width,
          height,
          fps,
          quality: 'balanced',
        },
      });

      if (data.success && data.data) {
        const job = data.data;
        setCurrentJobId(job.id);

        // Polling fallback in case WebSocket is disconnected
        const pollInterval = setInterval(async () => {
          try {
            const res = await api.get(`/render/jobs/${job.id}`);
            if (res.data.success && res.data.data) {
              const current = res.data.data;
              setRenderProgress(current.progress || 0);

              if (current.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setIsRendering(false);
                setOutputUrl(current.outputUrl);
              } else if (current.status === 'FAILED') {
                clearInterval(pollInterval);
                setIsRendering(false);
                setErrorMessage(current.errorMessage || 'Rendering failed.');
              }
            }
          } catch {
            // keep polling
          }
        }, 1500);
      }
    } catch (err: any) {
      setIsRendering(false);
      setErrorMessage(err.response?.data?.error || 'Failed to queue render job.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-base">
            <Download className="w-5 h-5 text-blue-500" />
            <span>Export Video</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Render your composition into a high-quality standalone MP4 video using local FFmpeg.
          </DialogDescription>
        </DialogHeader>

        {!isRendering && !outputUrl && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Resolution Preset</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: ExportResolution.RES_720P, label: '720p HD' },
                  { id: ExportResolution.RES_1080P, label: '1080p FHD' },
                  { id: ExportResolution.RES_4K, label: '4K Ultra' },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setResolution(res.id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      resolution === res.id
                        ? 'border-blue-500 bg-blue-600/20 text-white ring-1 ring-blue-500'
                        : 'border-gray-800 bg-gray-800/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Frame Rate</Label>
              <div className="grid grid-cols-2 gap-2">
                {[30, 60].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFps(f)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      fps === f
                        ? 'border-blue-500 bg-blue-600/20 text-white ring-1 ring-blue-500'
                        : 'border-gray-800 bg-gray-800/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    {f} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/60 text-[11px] text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Project Duration:</span>
                <span className="font-mono">{timeline?.duration || 30}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="font-mono font-semibold text-white">MP4 (H.264 + AAC)</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar View During Rendering */}
        {isRendering && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <div>
              <div className="text-sm font-semibold text-white">
                Rendering Video with FFmpeg...
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Composing tracks, encoding audio & assembling frames
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-blue-400">
              {renderProgress}% Complete
            </span>
          </div>
        )}

        {/* Output Ready Download View */}
        {outputUrl && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-white">Render Complete!</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Your video is ready to download and share.
              </div>
            </div>

            <a
              href={outputUrl}
              download={`${projectName || 'video'}.mp4`}
              className="w-full"
            >
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                <Download className="w-4 h-4 mr-2" />
                Download MP4 Video
              </Button>
            </a>
          </div>
        )}

        <DialogFooter className="pt-2">
          {!isRendering && !outputUrl && (
            <>
              <Button variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleStartExport}
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
              >
                Start Export
              </Button>
            </>
          )}
          {outputUrl && (
            <Button variant="outline" onClick={onClose} size="sm" className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

