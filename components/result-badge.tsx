import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComplianceResult } from "@/types";

const styles: Record<ComplianceResult, string> = {
  COMPLIES:
    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  DEVIATES: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100",
  UNCLEAR: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
};

const labels: Record<ComplianceResult, string> = {
  COMPLIES: "COMPLIES",
  DEVIATES: "DEVIATES",
  UNCLEAR: "NO STANDARD",
};

interface ResultBadgeProps {
  result: ComplianceResult;
  size?: "sm" | "lg";
}

export function ResultBadge({ result, size = "sm" }: ResultBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold tracking-wide",
        styles[result],
        size === "lg" && "text-sm px-3 py-1"
      )}
    >
      {labels[result]}
    </Badge>
  );
}
