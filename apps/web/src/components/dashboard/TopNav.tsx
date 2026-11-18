'use client';

import React from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Film, Sparkles, Coins, LogOut, ChevronDown, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import Link from 'next/link';

export function TopNav({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) {
  const { user, workspace, logout } = useAuthStore();

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white text-base tracking-tight">AI Video Studio</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">
              PRO
            </span>
          </div>
        </Link>

        {workspace && (
          <div className="hidden sm:flex items-center space-x-2 bg-gray-800/80 px-3 py-1 rounded-md text-xs font-medium text-gray-300 border border-gray-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{workspace.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md text-xs font-medium text-amber-400">
          <Coins className="w-3.5 h-3.5" />
          <span>100 Credits</span>
        </div>

        <Button
          onClick={onCreateProject}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-8 px-3.5 shadow-md shadow-blue-600/25"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Project
        </Button>

        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-800">
            <div className="w-7 h-7 rounded-full bg-blue-700/50 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-white">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs text-gray-300 hidden md:inline">{user.fullName}</span>
            <Button
              onClick={logout}
              variant="ghost"
              size="iconSm"
              className="text-gray-400 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

