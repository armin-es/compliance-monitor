"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Analysis, AnalysisRequest, ApiError } from "@/types";
import { ANALYSES_KEY } from "./use-analyses";

async function postAnalyze(data: AnalysisRequest): Promise<Analysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      error: "Unknown error",
      code: "INTERNAL_ERROR",
    }))) as ApiError;
    throw new Error(err.error);
  }

  return res.json();
}

async function patchAnalyze(id: string, data: AnalysisRequest): Promise<Analysis> {
  const res = await fetch(`/api/analyses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      error: "Unknown error",
      code: "INTERNAL_ERROR",
    }))) as ApiError;
    throw new Error(err.error);
  }

  return res.json();
}

export function useAnalyze() {
  const queryClient = useQueryClient();

  return useMutation<Analysis, Error, AnalysisRequest>({
    mutationFn: postAnalyze,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANALYSES_KEY }),
  });
}

export function useReanalyze(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Analysis, Error, AnalysisRequest>({
    mutationFn: (data) => patchAnalyze(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANALYSES_KEY }),
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete analysis");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANALYSES_KEY }),
  });
}
