"use client";

import { useState } from "react";
import { useAnalyses } from "@/hooks/use-analyses";
import { useAnalyze, useReanalyze, useDeleteAnalysis } from "@/hooks/use-analyze";
import { AnalysisForm } from "@/components/analysis-form";
import { ResultPanel, ResultPanelSkeleton } from "@/components/result-panel";
import { HistoryList } from "@/components/history-list";
import type { Analysis } from "@/types";

interface ComplianceMonitorProps {
  initialAnalyses: Analysis[];
}

export function ComplianceMonitor({ initialAnalyses }: ComplianceMonitorProps) {
  const { data: analyses = [] } = useAnalyses({ initialData: initialAnalyses });
  const [latestResult, setLatestResult] = useState<Analysis | null>(
    initialAnalyses[0] ?? null
  );
  const [editingEntry, setEditingEntry] = useState<Analysis | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate: analyze, isPending: isAnalyzing } = useAnalyze();
  const { mutate: reanalyze, isPending: isReanalyzing } = useReanalyze(
    editingEntry?.id ?? ""
  );
  const { mutate: deleteAnalysis } = useDeleteAnalysis();

  const isPending = isAnalyzing || isReanalyzing;

  function handleSubmit(data: { action: string; guideline: string }) {
    if (editingEntry) {
      reanalyze(data, {
        onSuccess: (updated) => {
          setLatestResult(updated);
          setEditingEntry(null);
        },
      });
    } else {
      analyze(data, {
        onSuccess: (created) => {
          setLatestResult(created);
        },
      });
    }
  }

  function handleEdit(analysis: Analysis) {
    setEditingEntry(analysis);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingEntry(null);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteAnalysis(id, {
      onSettled: () => setDeletingId(null),
      onSuccess: () => {
        if (latestResult?.id === id) setLatestResult(analyses[1] ?? null);
      },
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Compliance Check
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Describe what was done and which standard applies.
            </p>
          </div>
          <AnalysisForm
            onSubmit={handleSubmit}
            isPending={isPending}
            editingValues={editingEntry}
            onCancelEdit={handleCancelEdit}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Result</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              AI-powered classification against the process standard.
            </p>
          </div>
          {isPending ? (
            <ResultPanelSkeleton />
          ) : latestResult ? (
            <ResultPanel analysis={latestResult} />
          ) : (
            <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
              <p className="text-sm text-slate-400">
                Run a check to see results here
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Compliance Log
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              All findings for your account, newest first.
            </p>
          </div>
          {analyses.length > 0 && (
            <p className="text-xs text-slate-400">{analyses.length} entries</p>
          )}
        </div>
        <HistoryList
          analyses={analyses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}
