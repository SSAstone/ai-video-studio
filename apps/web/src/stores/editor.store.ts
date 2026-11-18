import { create } from 'zustand';
import { Timeline, Clip, Track } from '@ai-video-studio/video-schema';
import {
  HistoryManager,
  TimelineCommand,
  SplitClipCommand,
  RemoveClipCommand,
  UpdateClipCommand,
  quantizeToFrames,
} from '@ai-video-studio/timeline-engine';
import { api } from '../lib/api';
import { uuidv4 } from '../lib/uuid';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface EditorState {
  projectId: string | null;
  projectName: string;
  aspectRatio: string;
  timeline: Timeline | null;
  history: HistoryManager | null;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTime: number; // playhead position in seconds
  isPlaying: boolean;
  zoom: number; // pixels per second
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  activeSidebarTab: string;

  // Actions
  setProjectId: (id: string) => void;
  loadProject: (projectId: string) => Promise<void>;
  dispatchCommand: (cmd: TimelineCommand) => void;
  undo: () => void;
  redo: () => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayPause: () => void;
  setZoom: (zoom: number) => void;
  selectClip: (clipId: string | null, trackId?: string | null) => void;
  setActiveSidebarTab: (tab: string) => void;
  saveTimeline: (changeSummary?: string) => Promise<void>;
  splitClipAtPlayhead: () => void;
  deleteSelectedClip: () => void;
  updateSelectedClip: (updates: Partial<Clip>) => void;
  getSelectedClip: () => Clip | null;
}

let autosaveTimeout: NodeJS.Timeout | null = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectName: 'Untitled Video',
  aspectRatio: '16:9',
  timeline: null,
  history: null,
  selectedClipId: null,
  selectedTrackId: null,
  currentTime: 0,
  isPlaying: false,
  zoom: 60, // 60px per second default
  saveStatus: 'saved',
  canUndo: false,
  canRedo: false,
  activeSidebarTab: 'media',

  setProjectId: (id) => set({ projectId: id }),

  loadProject: async (projectId) => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      if (data.success && data.data) {
        const proj = data.data;
        const timeline = proj.timeline as Timeline;
        const historyManager = new HistoryManager(timeline);

        set({
          projectId: proj.id,
          projectName: proj.name,
          aspectRatio: proj.aspectRatio,
          timeline,
          history: historyManager,
          selectedClipId: null,
          selectedTrackId: null,
          currentTime: 0,
          isPlaying: false,
          canUndo: false,
          canRedo: false,
          saveStatus: 'saved',
        });

        // Subscribe to history changes
        historyManager.subscribe((tl, canUndo, canRedo) => {
          set({
            timeline: tl,
            canUndo,
            canRedo,
            saveStatus: 'unsaved',
          });

          // Debounced autosave
          if (autosaveTimeout) clearTimeout(autosaveTimeout);
          autosaveTimeout = setTimeout(() => {
            get().saveTimeline();
          }, 1500);
        });
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  },

  dispatchCommand: (cmd) => {
    const { history } = get();
    if (!history) return;
    history.execute(cmd);
  },

  undo: () => {
    const { history } = get();
    if (!history || !history.canUndo()) return;
    history.undo();
  },

  redo: () => {
    const { history } = get();
    if (!history || !history.canRedo()) return;
    history.redo();
  },

  setCurrentTime: (time) => {
    const { timeline } = get();
    const maxDuration = timeline?.duration || 30;
    const clamped = Math.max(0, Math.min(time, maxDuration));
    set({ currentTime: quantizeToFrames(clamped, timeline?.fps || 30) });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(zoom, 300)) }),

  selectClip: (clipId, trackId) =>
    set({
      selectedClipId: clipId,
      selectedTrackId: trackId || null,
    }),

  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  saveTimeline: async (changeSummary) => {
    const { projectId, timeline } = get();
    if (!projectId || !timeline) return;

    set({ saveStatus: 'saving' });
    try {
      await api.put(`/projects/${projectId}/timeline`, {
        timeline,
        changeSummary: changeSummary || 'Autosave',
      });
      set({ saveStatus: 'saved' });
    } catch (err) {
      console.error('Save timeline failed:', err);
      set({ saveStatus: 'error' });
    }
  },

  splitClipAtPlayhead: () => {
    const { timeline, currentTime, selectedClipId, history } = get();
    if (!timeline || !history) return;

    let targetClip: Clip | null = null;
    let targetTrack: Track | null = null;

    if (selectedClipId) {
      for (const track of timeline.tracks) {
        const found = track.clips.find((c) => c.id === selectedClipId);
        if (found) {
          targetClip = found;
          targetTrack = track;
          break;
        }
      }
    } else {
      // Find clip currently under playhead
      for (const track of timeline.tracks) {
        const found = track.clips.find(
          (c) => currentTime > c.start + 0.05 && currentTime < c.start + c.duration - 0.05
        );
        if (found) {
          targetClip = found;
          targetTrack = track;
          break;
        }
      }
    }

    if (!targetClip || !targetTrack) return;

    // Check if playhead is strictly inside target clip
    if (currentTime <= targetClip.start + 0.05 || currentTime >= targetClip.start + targetClip.duration - 0.05) {
      return;
    }

    const newClipId = uuidv4();
    const splitCmd = new SplitClipCommand(targetClip.id, currentTime, newClipId);
    history.execute(splitCmd);
    set({ selectedClipId: newClipId });
  },

  deleteSelectedClip: () => {
    const { selectedClipId, history } = get();
    if (!selectedClipId || !history) return;

    const removeCmd = new RemoveClipCommand(selectedClipId);
    history.execute(removeCmd);
    set({ selectedClipId: null });
  },

  updateSelectedClip: (updates) => {
    const { selectedClipId, history } = get();
    if (!selectedClipId || !history) return;

    const updateCmd = new UpdateClipCommand(selectedClipId, updates);
    history.execute(updateCmd);
  },

  getSelectedClip: () => {
    const { timeline, selectedClipId } = get();
    if (!timeline || !selectedClipId) return null;

    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  },
}));
