import type { ComplianceResult } from "@/types";

const HF_MODEL = "facebook/bart-large-mnli";
export const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
export const CANDIDATE_LABELS = ["compliant", "non-compliant", "unclear"] as const;
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 45_000;

export type HFResponse = { label: string; score: number }[];

interface HFLoadingError {
  error: string;
  estimated_time?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HuggingFaceError extends Error {
  constructor(
    message: string,
    public readonly code: "TIMEOUT" | "NETWORK" | "MODEL_UNAVAILABLE" | "API_ERROR"
  ) {
    super(message);
    this.name = "HuggingFaceError";
  }
}

export async function callHuggingFace(
  action: string,
  guideline: string,
  token: string,
  attempt = 1
): Promise<HFResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Reported action: ${action}\nProcess standard: ${guideline}`,
        parameters: {
          candidate_labels: CANDIDATE_LABELS,
          hypothesis_template: "The described action is {}.",
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new HuggingFaceError("Request timed out after 45 seconds", "TIMEOUT");
    }
    throw new HuggingFaceError("Network error reaching HuggingFace API", "NETWORK");
  }
  clearTimeout(timer);

  if (response.status === 503) {
    const body = (await response.json().catch(() => ({}))) as HFLoadingError;
    if (attempt < MAX_RETRIES) {
      await sleep(Math.pow(2, attempt) * 1000);
      return callHuggingFace(action, guideline, token, attempt + 1);
    }
    throw new HuggingFaceError(
      `Model unavailable after ${MAX_RETRIES} attempts: ${body.error ?? "loading"}`,
      "MODEL_UNAVAILABLE"
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HuggingFaceError(
      `HuggingFace API error ${response.status}: ${body}`,
      "API_ERROR"
    );
  }

  return response.json() as Promise<HFResponse>;
}

export function mapResult(hfResponse: HFResponse): {
  result: ComplianceResult;
  confidence: number;
} {
  const top = hfResponse[0];
  const topLabel = (top?.label ?? "unclear").toUpperCase();
  const confidence = top?.score ?? 0;

  let result: ComplianceResult;
  if (topLabel === "COMPLIANT") result = "COMPLIES";
  else if (topLabel === "NON-COMPLIANT") result = "DEVIATES";
  else result = "UNCLEAR";

  return { result, confidence };
}
