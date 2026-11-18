'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useEditorStore } from '../../stores/editor.store';
import { formatTimecode, quantizeToFrames } from '@ai-video-studio/timeline-engine';
import { Clip } from '@ai-video-studio/video-schema';

export function PreviewPlayer() {
  const {
    timeline,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    togglePlayPause,
    aspectRatio,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Playback timer loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number = performance.now();

    const loop = (timestamp: number) => {
      const deltaSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isPlaying && timeline) {
        const nextTime = currentTime + deltaSeconds;
        if (nextTime >= (timeline.duration || 30)) {
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(nextTime);
        }
      }

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      lastTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, currentTime, timeline, setCurrentTime, setIsPlaying]);

  // Spacebar play/pause shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const fps = timeline?.fps || 30;
  const duration = timeline?.duration || 30;
  const formattedCurrentTime = formatTimecode(currentTime, fps, true);
  const formattedDuration = formatTimecode(duration, fps, false);

  // Determine active clips at the current playhead
  const activeClips: { clip: Clip; trackIndex: number }[] = [];
  if (timeline) {
    timeline.tracks.forEach((track) => {
      if (!track.isVisible) return;
      track.clips.forEach((clip) => {
        if (currentTime >= clip.start && currentTime < clip.start + clip.duration) {
          activeClips.push({ clip, trackIndex: track.index });
        }
      });
    });
  }

  // Calculate aspect ratio dimensions
  const width = timeline?.width || 1920;
  const height = timeline?.height || 1080;
  const canvasAspectRatio = `${width} / ${height}`;

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full flex flex-col bg-[#070A0F] relative overflow-hidden select-none"
    >
      {/* Viewport Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className="relative max-h-full max-w-full bg-black rounded-lg shadow-2xl border border-gray-800/80 overflow-hidden flex items-center justify-center transition-all"
          style={{
            aspectRatio: canvasAspectRatio,
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Active Visual Clips Layer */}
          {activeClips.map(({ clip }) => {
            const transform = clip.transform || {
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              opacity: 1,
            };

            // Build filter string from clip.effects
            const filterStrings: string[] = [];
            if (clip.effects && clip.effects.length > 0) {
              clip.effects.forEach((eff) => {
                if (!eff.enabled) return;
                if (eff.type === 'brightness') filterStrings.push(`brightness(${eff.value})`);
                if (eff.type === 'contrast') filterStrings.push(`contrast(${eff.value})`);
                if (eff.type === 'saturation') filterStrings.push(`saturate(${eff.value})`);
                if (eff.type === 'blur') filterStrings.push(`blur(${eff.value}px)`);
                if (eff.type === 'grayscale') filterStrings.push(`grayscale(${eff.value})`);
                if (eff.type === 'sepia') filterStrings.push(`sepia(${eff.value})`);
              });
            }
            const filterStyle = filterStrings.join(' ') || undefined;

            const clipStyle: React.CSSProperties = {
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
              opacity: transform.opacity,
              filter: filterStyle,
              zIndex: transform.zIndex || 1,
            };

            // Image or Video Clip
            if (clip.type === 'video' || clip.type === 'image') {
              return (
                <div
                  key={clip.id}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                  style={clipStyle}
                >
                  {clip.mediaUrl ? (
                    clip.type === 'video' ? (
                      <video
                        src={clip.mediaUrl}
                        className="w-full h-full object-cover"
                        muted={isMuted || clip.audio?.muted}
                      />
                    ) : (
                      <img src={clip.mediaUrl} alt={clip.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    // Fallback visual clip placeholder
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900/60 via-indigo-900/40 to-gray-900 flex flex-col items-center justify-center p-4 text-center">
                      <div className="text-sm font-semibold text-white/90">{clip.name}</div>
                      <div className="text-[11px] text-blue-300/80 mt-1 font-mono">
                        {(currentTime - clip.start).toFixed(2)}s / {clip.duration.toFixed(2)}s
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Text Clip Layer
            if (clip.type === 'text' && clip.text) {
              const textConf = clip.text;
              return (
                <div
                  key={clip.id}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={clipStyle}
                >
                  <div
                    style={{
                      fontFamily: textConf.fontFamily,
                      fontSize: `${textConf.fontSize * (height / 1080)}px`,
                      fontWeight: textConf.fontWeight as any,
                      color: textConf.color,
                      backgroundColor: textConf.backgroundColor || 'transparent',
                      textAlign: textConf.textAlign as any,
                      padding: `${textConf.padding || 8}px`,
                      borderRadius: `${textConf.borderRadius || 4}px`,
                      textShadow: textConf.shadowBlur
                        ? `${textConf.shadowOffsetX}px ${textConf.shadowOffsetY}px ${textConf.shadowBlur}px ${textConf.shadowColor || 'rgba(0,0,0,0.8)'}`
                        : undefined,
                    }}
                  >
                    {textConf.content}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Empty Canvas Indicator */}
          {activeClips.length === 0 && (
            <div className="text-center text-gray-600 select-none pointer-events-none p-6">
              <div className="text-xs font-medium tracking-wide">CANVAS PREVIEW</div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                {width} × {height} • {aspectRatio}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Playback Controls Bar */}
      <div className="h-12 border-t border-gray-800 bg-gray-950/90 px-6 flex items-center justify-between z-20">
        {/* Left: Timecode Display */}
        <div className="flex items-center space-x-2 font-mono text-xs text-gray-300">
          <span className="text-white font-semibold">{formattedCurrentTime}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">{formattedDuration}</span>
        </div>

        {/* Center: Play/Pause/Skip Controls */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setCurrentTime(0)}
            variant="ghost"
            size="iconSm"
            title="Beginning (Home)"
            className="text-gray-400 hover:text-white"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </Button>

          <Button
            onClick={() => setCurrentTime(duration)}
            variant="ghost"
            size="iconSm"
            title="End"
            className="text-gray-400 hover:text-white"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Right: Mute & Fullscreen Toggles */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="ghost"
            size="iconSm"
            title={isMuted ? 'Unmute' : 'Mute'}
            className="text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="iconSm"
            title="Toggle Fullscreen"
            className="text-gray-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

