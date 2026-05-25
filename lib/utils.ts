import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComplianceResult } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONFIDENCE_THRESHOLD = 0.7;

export function requiresHumanReview(confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLD;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function resultLabel(result: ComplianceResult): string {
  if (result === "UNCLEAR") return "NO STANDARD";
  return result;
}
