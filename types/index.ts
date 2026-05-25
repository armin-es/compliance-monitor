export type ComplianceResult = "COMPLIES" | "DEVIATES" | "UNCLEAR";

export interface AnalysisRequest {
  action: string;
  guideline: string;
}

export interface Analysis {
  id: string;
  userId: string;
  action: string;
  guideline: string;
  result: ComplianceResult;
  confidence: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "MODEL_UNAVAILABLE"
    | "INTERNAL_ERROR";
}
