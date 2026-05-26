"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnalysisForm } from "@/components/analysis-form";
import { ResultPanel, ResultPanelSkeleton } from "@/components/result-panel";
import { useAnalyze, useReanalyze } from "@/hooks/use-analyze";
import type { Analysis } from "@/types";

type View = "form" | "result";

interface CheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry: Analysis | null;
  onClose: () => void;
}

export function CheckDialog({
  open,
  onOpenChange,
  editingEntry,
  onClose,
}: CheckDialogProps) {
  const [view, setView] = useState<View>("form");
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const { mutate: analyze, isPending: isAnalyzing } = useAnalyze();
  const { mutate: reanalyze, isPending: isReanalyzing } = useReanalyze(
    editingEntry?.id ?? ""
  );
  const isPending = isAnalyzing || isReanalyzing;

  function handleSubmit(data: { action: string; guideline: string }) {
    setError(null);
    if (editingEntry) {
      reanalyze(data, {
        onSuccess: (updated) => {
          setResult(updated);
          setView("result");
        },
        onError: (err) => setError(err.message),
      });
    } else {
      analyze(data, {
        onSuccess: (created) => {
          setResult(created);
          setView("result");
        },
        onError: (err) => setError(err.message),
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setView("form");
      setResult(null);
      setError(null);
      setFormKey(0);
      onClose();
    }
    onOpenChange(nextOpen);
  }

  function handleRunAnother() {
    setView("form");
    setResult(null);
    setError(null);
    setFormKey((k) => k + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? "Edit Entry" : "Run Compliance Check"}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <ResultPanelSkeleton />
        ) : view === "result" && result ? (
          <div className="space-y-4">
            <ResultPanel analysis={result} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRunAnother}>
                Run Another Check
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => handleOpenChange(false)}
                data-testid="done-button"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}
            <AnalysisForm
              key={editingEntry?.id ?? `form-${formKey}`}
              onSubmit={handleSubmit}
              isPending={isPending}
              editingValues={editingEntry}
              onCancelEdit={() => handleOpenChange(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
