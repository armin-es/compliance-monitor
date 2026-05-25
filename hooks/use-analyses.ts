"use client";

import { useQuery } from "@tanstack/react-query";
import type { Analysis } from "@/types";

export const ANALYSES_KEY = ["analyses"] as const;

export function useAnalyses(options?: { initialData?: Analysis[] }) {
  return useQuery<Analysis[]>({
    queryKey: ANALYSES_KEY,
    queryFn: async () => {
      const res = await fetch("/api/analyses");
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
    initialData: options?.initialData,
  });
}
