"use client";

import { Progress } from "@/components/ui/progress";
import { AlertTriangle, HelpCircle } from "lucide-react";
import type { Analysis } from "@/types";
import {
  formatConfidence,
  requiresHumanReview,
  formatTimestamp,
} from "@/lib/utils";
import { ResultBadge } from "@/components/result-badge";

interface ResultPanelProps {
  analysis: Analysis;
}

export function ResultPanel({ analysis }: ResultPanelProps) {
  const needsReview = requiresHumanReview(analysis.confidence);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-5 space-y-4"
      data-testid="result-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Latest Result
          </p>
          <ResultBadge result={analysis.result} size="lg" />
        </div>
        <p className="text-xs text-slate-400 pt-1 text-right">
          {formatTimestamp(analysis.createdAt)}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Confidence</span>
          <span className="font-medium">{formatConfidence(analysis.confidence)}</span>
        </div>
        <Progress
          value={analysis.confidence * 100}
          className="h-2"
        />
      </div>

      {analysis.result === "UNCLEAR" && (
        <div className="flex gap-2.5 rounded-md bg-amber-50 border border-amber-200 p-3">
          <HelpCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">No applicable process standard found.</span>{" "}
            Consider defining a standard for this action type.
          </p>
        </div>
      )}

      {needsReview && analysis.result !== "UNCLEAR" && (
        <div className="flex gap-2.5 rounded-md bg-slate-50 border border-slate-200 p-3">
          <AlertTriangle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600">
            <span className="font-medium">Low confidence — human review recommended.</span>{" "}
            The model is uncertain about this classification.
          </p>
        </div>
      )}
    </div>
  );
}

export function ResultPanelSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="h-7 w-28 rounded-full bg-slate-100" />
        </div>
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-32 rounded bg-slate-100" />
        <div className="h-2 w-full rounded bg-slate-100" />
      </div>
    </div>
  );
}
