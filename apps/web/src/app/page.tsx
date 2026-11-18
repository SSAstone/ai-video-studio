'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { TopNav } from '../components/dashboard/TopNav';
import { ProjectGrid, ProjectCardItem } from '../components/dashboard/ProjectGrid';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Plus,
  Sparkles,
  Film,
  Search,
  LayoutGrid,
  FolderOpen,
  ArrowRight,
  Video,
  Layers,
  Wand2,
} from 'lucide-react';
import { api } from '../lib/api';

export default function DashboardPage() {
  const { user, workspace, isAuthenticated, isLoading, initAuth, login, register } = useAuthStore();
  const [projects, setProjects] = useState<ProjectCardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Quick Auth form state for unauthenticated preview
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('admin@aivideostudio.local');
  const [authPassword, setAuthPassword] = useState('admin123456');
  const [authName, setAuthName] = useState('Studio Admin');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (workspace?.id) {
      fetchProjects(workspace.id);
    }
  }, [workspace?.id]);

  const fetchProjects = async (workspaceId: string) => {
    setLoadingProjects(true);
    try {
      const { data } = await api.get(`/projects?workspaceId=${workspaceId}`);
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data);
      }
    } catch (err) {
      console.warn('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { data } = await api.post(`/projects/${id}/duplicate`);
      if (data.success && workspace?.id) {
        fetchProjects(workspace.id);
      }
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword);
      } else {
        await register(authName, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    }
  };

  // If user is not yet logged in, show polished sign-in portal
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Video Studio</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              CapCut-style multi-track timeline video editor with local-first rendering & AI automation.
            </p>
          </div>

          <div className="flex rounded-lg bg-gray-800/80 p-1 mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                authMode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                authMode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="text-xs text-gray-300 font-medium block mb-1">Full Name</label>
                <Input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Alex Studio"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-300 font-medium block mb-1">Email</label>
              <Input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="editor@aivideostudio.local"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 font-medium block mb-1">Password</label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2">
              {authMode === 'login' ? 'Sign In to Studio' : 'Get Started Free'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-800 text-center">
            <span className="text-[11px] text-gray-500">
              Local-first video processing • No cloud account required
            </span>
          </div>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col">
      <TopNav onCreateProject={() => setIsCreateModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Quick Action Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 p-8 mb-10 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Browser Video Editing</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Turn ideas into viral videos in minutes.
            </h1>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              Multi-track timeline, frame-accurate trimming, instant local FFmpeg rendering, and
              prompt-driven AI automation all in your browser.
            </p>
            <div className="mt-5 flex items-center space-x-3">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 px-5 shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Blank Project
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Projects</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and edit your timeline compositions
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-gray-900/80 border-gray-800 text-gray-200"
              />
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid or Blank Slate */}
        {filteredProjects.length > 0 ? (
          <ProjectGrid
            projects={filteredProjects}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onRename={() => {}}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gray-800/80 border border-gray-700/60 flex items-center justify-center mb-3 text-gray-400">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No projects yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mt-1 mb-5">
              Start editing with a blank canvas or choose an aspect ratio preset to begin cutting your
              next video.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-5"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Video
            </Button>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
        }}
      />
    </div>
  );
}

