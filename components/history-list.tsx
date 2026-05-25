"use client";

import { ClipboardList } from "lucide-react";
import { HistoryItem } from "@/components/history-item";
import type { Analysis } from "@/types";

interface HistoryListProps {
  analyses: Analysis[];
  onEdit: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function HistoryList({
  analyses,
  onEdit,
  onDelete,
  deletingId,
}: HistoryListProps) {
  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
        <ClipboardList className="mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">No findings logged yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Submit a compliance check above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="history-list">
      {analyses.map((analysis) => (
        <HistoryItem
          key={analysis.id}
          analysis={analysis}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deletingId === analysis.id}
        />
      ))}
    </div>
  );
}
