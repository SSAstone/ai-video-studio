import { create } from 'zustand';
import { api } from '../lib/api';
import { UserRole, WorkspaceRole } from '@ai-video-studio/shared-types';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  role: WorkspaceRole;
}

interface AuthState {
  user: UserSession | null;
  workspace: WorkspaceSession | null;
  workspaces: WorkspaceSession[];
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setWorkspace: (ws: WorkspaceSession) => void;
  fetchWorkspaces: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  workspace: null,
  workspaces: [],
  isAuthenticated: false,
  isLoading: true,

  initAuth: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_session');
    const savedWs = localStorage.getItem('workspace_session');

    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const ws = savedWs ? JSON.parse(savedWs) : null;
        set({
          user,
          workspace: ws,
          isAuthenticated: true,
          isLoading: false,
        });
        get().fetchWorkspaces();
        return;
      } catch {
        // invalid JSON
      }
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success && data.data) {
        const { user, currentWorkspace, tokens } = data.data;
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('user_session', JSON.stringify(user));
        localStorage.setItem('workspace_session', JSON.stringify(currentWorkspace));

        set({
          user,
          workspace: currentWorkspace,
          isAuthenticated: true,
        });
        get().fetchWorkspaces();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err.response?.data?.error || err.message);
      throw err;
    }
  },

  register: async (fullName, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { fullName, email, password });
      if (data.success && data.data) {
        const { user, currentWorkspace, tokens } = data.data;
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('user_session', JSON.stringify(user));
        localStorage.setItem('workspace_session', JSON.stringify(currentWorkspace));

        set({
          user,
          workspace: currentWorkspace,
          isAuthenticated: true,
        });
        get().fetchWorkspaces();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Registration error:', err.response?.data?.error || err.message);
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_session');
    localStorage.removeItem('workspace_session');
    set({
      user: null,
      workspace: null,
      workspaces: [],
      isAuthenticated: false,
    });
  },

  setWorkspace: (ws) => {
    localStorage.setItem('workspace_session', JSON.stringify(ws));
    set({ workspace: ws });
  },

  fetchWorkspaces: async () => {
    try {
      const { data } = await api.get('/workspaces');
      if (data.success && Array.isArray(data.data)) {
        set({ workspaces: data.data });
      }
    } catch (err) {
      console.warn('Failed to fetch workspaces:', err);
    }
  },
}));

