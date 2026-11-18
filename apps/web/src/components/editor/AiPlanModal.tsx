'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Wand2, CheckCircle2, XCircle, ArrowRight, Clock, Layers } from 'lucide-react';
import { AiEditPlan } from '@ai-video-studio/video-schema';
import { useEditorStore } from '../../stores/editor.store';
import { api } from '../../lib/api';

interface AiPlanModalProps {
  plan: AiEditPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AiPlanModal({ plan, isOpen, onClose }: AiPlanModalProps) {
  const { projectId, loadProject } = useEditorStore();
  const [isApplying, setIsApplying] = useState(false);

  if (!plan) return null;

  const handleApproveAndApply = async () => {
    if (!projectId) return;

    setIsApplying(true);
    try {
      const { data } = await api.post(`/ai/projects/${projectId}/apply`, plan);
      if (data.success) {
        await loadProject(projectId);
        onClose();
      }
    } catch (err) {
      console.error('Failed to apply AI plan:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-base text-purple-400">
            <Wand2 className="w-5 h-5" />
            <span>Review AI Proposed Edits</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Review the actions planned by AI before applying them to your timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Original Prompt */}
          <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              User Prompt
            </span>
            <span className="text-xs text-gray-200 font-medium italic mt-0.5 block">
              "{plan.prompt}"
            </span>
          </div>

          {/* AI Explanation */}
          <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-500/30">
            <span className="text-[10px] uppercase font-semibold text-purple-400 block mb-1">
              AI Analysis & Action
            </span>
            <p className="text-xs text-purple-100 leading-relaxed">{plan.explanation}</p>
          </div>

          {/* Planned Operations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Planned Operations ({plan.commands.length})</span>
              </span>

              {plan.durationDelta !== 0 && (
                <span className="text-[11px] font-mono text-gray-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>
                    Duration change: {plan.durationDelta > 0 ? `+${plan.durationDelta}s` : `${plan.durationDelta}s`}
                  </span>
                </span>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {plan.commands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-gray-800/60 border border-gray-700/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-gray-200">{cmd.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Validated</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isApplying}
            size="sm"
            className="border-gray-700 text-gray-300"
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Reject & Discard
          </Button>

          <Button
            onClick={handleApproveAndApply}
            disabled={isApplying}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-purple-600/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {isApplying ? 'Applying to Timeline...' : 'Approve & Apply Edits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

