"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAnalyses } from "@/hooks/use-analyses";
import { useDeleteAnalysis } from "@/hooks/use-analyze";
import { Button } from "@/components/ui/button";
import { CheckDialog } from "@/components/check-dialog";
import { HistoryList } from "@/components/history-list";
import type { Analysis } from "@/types";

interface ComplianceMonitorProps {
  initialAnalyses: Analysis[];
}

export function ComplianceMonitor({ initialAnalyses }: ComplianceMonitorProps) {
  const { data: analyses = [] } = useAnalyses({ initialData: initialAnalyses });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Analysis | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate: deleteAnalysis } = useDeleteAnalysis();

  function handleEdit(analysis: Analysis) {
    setEditingEntry(analysis);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteAnalysis(id, {
      onSettled: () => setDeletingId(null),
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) setEditingEntry(null);
    setDialogOpen(open);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Compliance Log
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            All findings for your account, newest first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {analyses.length > 0 && (
            <p className="text-xs text-slate-400">{analyses.length} entries</p>
          )}
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
            data-testid="open-check-dialog"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Run Check
          </Button>
        </div>
      </div>

      <HistoryList
        analyses={analyses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <CheckDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        editingEntry={editingEntry}
        onClose={() => setEditingEntry(null)}
      />
    </div>
  );
}
