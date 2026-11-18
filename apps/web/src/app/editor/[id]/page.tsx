'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditorStore } from '../../../stores/editor.store';
import { useAuthStore } from '../../../stores/auth.store';
import { TopToolbar } from '../../../components/editor/TopToolbar';
import { LeftSidebar } from '../../../components/editor/LeftSidebar';
import { PreviewPlayer } from '../../../components/editor/PreviewPlayer';
import { PropertiesPanel } from '../../../components/editor/PropertiesPanel';
import { Timeline } from '../../../components/editor/Timeline';
import { ExportModal } from '../../../components/editor/ExportModal';
import { AiPlanModal } from '../../../components/editor/AiPlanModal';
import { AiEditPlan } from '@ai-video-studio/video-schema';
import { Loader2 } from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { initAuth, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { loadProject, timeline } = useEditorStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeAiPlan, setActiveAiPlan] = useState<AiEditPlan | null>(null);
  const [isAiPlanOpen, setIsAiPlanOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).finally(() => {
        setIsPageLoading(false);
      });
    }
  }, [projectId, loadProject]);

  const handlePlanGenerated = (plan: AiEditPlan) => {
    setActiveAiPlan(plan);
    setIsAiPlanOpen(true);
  };

  if (isPageLoading || authLoading) {
    return (
      <div className="h-screen w-screen bg-[#070A0F] flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-semibold text-gray-400">Loading Video Studio Timeline...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#070A0F] flex flex-col overflow-hidden select-none font-sans text-gray-100">
      {/* Top Toolbar */}
      <TopToolbar onExportClick={() => setIsExportOpen(true)} />

      {/* Main Workspace (Sidebar + Canvas Preview + Properties Inspector) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar onPlanGenerated={handlePlanGenerated} />

        {/* Center Preview Player */}
        <PreviewPlayer />

        {/* Right Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Bottom Timeline */}
      <Timeline />

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />

      {/* AI Plan Review Modal */}
      <AiPlanModal
        plan={activeAiPlan}
        isOpen={isAiPlanOpen}
        onClose={() => setIsAiPlanOpen(false)}
      />
    </div>
  );
}

