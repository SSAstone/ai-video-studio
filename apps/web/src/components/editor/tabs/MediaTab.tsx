'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, Music, Image as ImageIcon, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';
import { useEditorStore } from '../../../stores/editor.store';
import { MediaAssetDto, MediaType } from '@ai-video-studio/shared-types';
import { AddClipCommand, formatTimecode } from '@ai-video-studio/timeline-engine';
import { uuidv4 } from '../../../lib/uuid';

export function MediaTab() {
  const { workspace } = useAuthStore();
  const { timeline, dispatchCommand, currentTime } = useEditorStore();
  const [mediaList, setMediaList] = useState<MediaAssetDto[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspace?.id) {
      fetchMedia();
    }
  }, [workspace?.id]);

  const fetchMedia = async () => {
    if (!workspace?.id) return;
    try {
      const { data } = await api.get(`/media?workspaceId=${workspace.id}`);
      if (data.success && Array.isArray(data.data)) {
        setMediaList(data.data);
      }
    } catch (err) {
      console.warn('Failed to load media:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !workspace?.id) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const { data } = await api.post(`/media/upload?workspaceId=${workspace.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success && data.data) {
          setMediaList((prev) => [data.data, ...prev]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddClipToTimeline = (asset: MediaAssetDto) => {
    if (!timeline) return;

    // Find compatible track
    const targetType = asset.type === MediaType.AUDIO ? 'audio' : 'video';
    const targetTrack =
      timeline.tracks.find((t) => t.type === targetType && !t.isLocked) ||
      timeline.tracks.find((t) => !t.isLocked) ||
      timeline.tracks[0];

    if (!targetTrack) return;

    // Calculate start time: right at current playhead position or end of track
    const start = currentTime || 0;
    const duration = asset.metadata.duration || (asset.type === MediaType.IMAGE ? 5 : 10);
    const clipId = uuidv4();

    const newClip = {
      id: clipId,
      trackId: targetTrack.id,
      name: asset.name,
      type: (asset.type === MediaType.AUDIO
        ? 'audio'
        : asset.type === MediaType.IMAGE
        ? 'image'
        : 'video') as any,
      start,
      duration,
      sourceStart: 0,
      sourceDuration: duration,
      mediaId: asset.id,
      mediaUrl: asset.url,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, zIndex: 0 },
      audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
      effects: [],
    };

    const cmd = new AddClipCommand(targetTrack.id, newClip);
    dispatchCommand(cmd);
  };

  const filteredMedia = mediaList.filter((m) => {
    if (filterType !== 'ALL' && m.type !== filterType) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col p-3 space-y-3">
      {/* Upload Button & Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/aac,image/jpeg,image/png"
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-700/80 hover:border-blue-500/80 bg-gray-900/60 hover:bg-gray-800/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
      >
        <div className="w-9 h-9 rounded-full bg-gray-800 group-hover:bg-blue-600/20 text-gray-400 group-hover:text-blue-400 flex items-center justify-center transition-colors">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-200 block">
            {isUploading ? 'Uploading & Processing...' : 'Upload Media'}
          </span>
          <span className="text-[10px] text-gray-500">MP4, MOV, MP3, WAV, PNG, JPG</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
        {['ALL', 'VIDEO', 'AUDIO', 'IMAGE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`flex-1 text-[11px] font-semibold py-1 rounded transition-colors ${
              filterType === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter assets..."
          className="h-7 text-xs pl-8 bg-gray-900/90 border-gray-800"
        />
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredMedia.map((asset) => {
          const isVideo = asset.type === MediaType.VIDEO;
          const isAudio = asset.type === MediaType.AUDIO;
          const isImage = asset.type === MediaType.IMAGE;

          return (
            <div
              key={asset.id}
              className="group relative flex items-center p-2 rounded-lg bg-gray-900/80 border border-gray-800/80 hover:border-blue-500/50 hover:bg-gray-800/60 transition-all"
            >
              {/* Asset Icon / Thumbnail */}
              <div className="w-12 h-10 rounded bg-gray-950 flex items-center justify-center overflow-hidden shrink-0 mr-2.5 border border-gray-800">
                {asset.thumbnailUrl ? (
                  <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                ) : isVideo ? (
                  <Film className="w-5 h-5 text-blue-400" />
                ) : isAudio ? (
                  <Music className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                )}
              </div>

              {/* Asset Details */}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-200 block truncate group-hover:text-blue-300">
                  {asset.name}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {asset.metadata.duration ? `${Math.round(asset.metadata.duration)}s` : '5s'} •{' '}
                  {(asset.sizeBytes / (1024 * 1024)).toFixed(1)}MB
                </span>
              </div>

              {/* Add to Timeline Button */}
              <Button
                onClick={() => handleAddClipToTimeline(asset)}
                size="iconSm"
                className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-500 text-white rounded-md shrink-0 shadow transition-opacity"
                title="Add to timeline"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}

        {filteredMedia.length === 0 && !isUploading && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No media found. Upload videos, images or audio to start editing.
          </div>
        )}
      </div>
    </div>
  );
}
