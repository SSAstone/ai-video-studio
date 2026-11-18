'use client';

import React, { useState } from 'react';
import { Wand2, Sparkles, Scissors, Subtitles, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { api } from '../../../lib/api';
import { useEditorStore } from '../../../stores/editor.store';
import { AiEditPlan } from '@ai-video-studio/video-schema';

interface AiTabProps {
  onPlanGenerated: (plan: AiEditPlan) => void;
}

const QUICK_PROMPTS = [
  { label: 'Add Title "Summer Vibe"', prompt: 'Add title "Summer Vibe" at the beginning' },
  { label: 'Remove Silent Sections', prompt: 'Remove silence from the audio' },
  { label: 'Auto-Generate Subtitles', prompt: 'Generate synchronized subtitles' },
  { label: 'Speed Up 1.5x', prompt: 'Speed up video clips by 1.5x' },
  { label: 'Trim 2s From End', prompt: 'Trim 2 seconds from the end of the clip' },
];

export function AiTab({ onPlanGenerated }: AiTabProps) {
  const { projectId } = useEditorStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async (targetPrompt?: string) => {
    const activePrompt = targetPrompt || prompt;
    if (!activePrompt.trim() || !projectId) return;

    setIsGenerating(true);
    setStatusMessage('Analyzing timeline and generating plan...');

    try {
      const { data } = await api.post(`/ai/projects/${projectId}/plan`, {
        prompt: activePrompt,
      });

      if (data.success && data.data) {
        setStatusMessage('Plan generated successfully!');
        onPlanGenerated(data.data as AiEditPlan);
      }
    } catch (err: any) {
      console.error('AI plan error:', err);
      setStatusMessage('Failed to generate edit plan. Try another prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-3 space-y-4 overflow-y-auto">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <Wand2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block">AI Studio Assistant</span>
          <span className="text-[10px] text-gray-400">Prompt-driven video editing</span>
        </div>
      </div>

      {/* Natural Language Prompt Input */}
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe how you want to edit this video... (e.g. Add title 'Vacation Intro', remove silence, or generate captions)"
          rows={3}
          className="w-full text-xs bg-gray-900 border border-gray-700/80 rounded-lg p-2.5 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />

        <Button
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          size="sm"
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Generating Plan...' : 'Generate AI Edit Plan'}</span>
        </Button>
      </div>

      {statusMessage && (
        <div className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg text-center">
          {statusMessage}
        </div>
      )}

      {/* Quick Prompts Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
          Quick AI Actions
        </span>
        <div className="space-y-1.5">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => {
                setPrompt(qp.prompt);
                handleGenerate(qp.prompt);
              }}
              className="w-full text-left p-2 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-800/80 hover:border-purple-500/50 transition-all flex items-center justify-between text-xs text-gray-300 group"
            >
              <span>{qp.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Safety & Preview notice */}
      <div className="mt-auto p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-[10px] text-gray-400">
        <div className="font-semibold text-gray-300 mb-0.5 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Safe & Deterministic</span>
        </div>
        AI generates validated timeline commands. You review the proposed edits and approve them before applying. Full undo support is maintained.
      </div>
    </div>
  );
}

