'use client';

import React from 'react';
import {
  FolderOpen,
  Type,
  Music,
  ArrowRightLeft,
  Sparkles,
  Wand2,
  Sliders,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editor.store';
import { MediaTab } from './tabs/MediaTab';
import { TextTab } from './tabs/TextTab';
import { AudioTab } from './tabs/AudioTab';
import { TransitionsTab } from './tabs/TransitionsTab';
import { EffectsTab } from './tabs/EffectsTab';
import { AiTab } from './tabs/AiTab';
import { AiEditPlan } from '@ai-video-studio/video-schema';

interface LeftSidebarProps {
  onPlanGenerated: (plan: AiEditPlan) => void;
}

const SIDEBAR_TABS = [
  { id: 'media', label: 'Media', icon: FolderOpen },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'transitions', label: 'Transitions', icon: ArrowRightLeft },
  { id: 'effects', label: 'Effects', icon: Sliders },
  { id: 'ai', label: 'AI Tools', icon: Wand2, badge: 'AI' },
];

export function LeftSidebar({ onPlanGenerated }: LeftSidebarProps) {
  const { activeSidebarTab, setActiveSidebarTab } = useEditorStore();

  return (
    <aside className="w-80 h-full border-r border-gray-800 bg-[#0B0F17] flex shrink-0 select-none overflow-hidden">
      {/* Icon Rail */}
      <nav className="w-16 h-full border-r border-gray-800/80 bg-gray-950/80 flex flex-col items-center py-3 space-y-1 shrink-0">
        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id)}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[9px] tracking-tight">{tab.label}</span>

              {tab.badge && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1 rounded-full shadow">
                  {tab.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Content Panel */}
      <div className="flex-1 h-full bg-[#0D121D] overflow-hidden">
        {activeSidebarTab === 'media' && <MediaTab />}
        {activeSidebarTab === 'text' && <TextTab />}
        {activeSidebarTab === 'audio' && <AudioTab />}
        {activeSidebarTab === 'transitions' && <TransitionsTab />}
        {activeSidebarTab === 'effects' && <EffectsTab />}
        {activeSidebarTab === 'ai' && <AiTab onPlanGenerated={onPlanGenerated} />}
      </div>
    </aside>
  );
}

