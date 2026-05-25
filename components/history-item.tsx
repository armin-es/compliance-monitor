"use client";

import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResultBadge } from "@/components/result-badge";
import { formatTimestamp, formatConfidence, requiresHumanReview } from "@/lib/utils";
import type { Analysis } from "@/types";

interface HistoryItemProps {
  analysis: Analysis;
  onEdit: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function HistoryItem({
  analysis,
  onEdit,
  onDelete,
  isDeleting,
}: HistoryItemProps) {
  const needsReview = requiresHumanReview(analysis.confidence);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
      data-testid="history-item"
    >
      <div className="pt-0.5 shrink-0">
        <ResultBadge result={analysis.result} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {analysis.action}
        </p>
        {analysis.guideline && (
          <p className="truncate text-xs text-slate-500">{analysis.guideline}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{formatConfidence(analysis.confidence)}</span>
          {needsReview && (
            <Tooltip>
              <TooltipTrigger className="inline-flex items-center">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>Human review recommended</TooltipContent>
            </Tooltip>
          )}
          <span>·</span>
          <Tooltip>
            <TooltipTrigger className="cursor-default">
              {new Date(analysis.createdAt).toLocaleDateString()}
            </TooltipTrigger>
            <TooltipContent>{formatTimestamp(analysis.createdAt)}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-700"
          onClick={() => onEdit(analysis)}
          aria-label="Edit entry"
          data-testid="edit-button"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-rose-600"
          onClick={() => onDelete(analysis.id)}
          disabled={isDeleting}
          aria-label="Delete entry"
          data-testid="delete-button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
