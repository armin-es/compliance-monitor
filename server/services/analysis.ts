import "server-only";
import type { ComplianceResult } from "@/types";
import {
  createAnalysis,
  updateAnalysis,
} from "@/server/repositories/analysis";

const HF_MODEL = "facebook/bart-large-mnli";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const CANDIDATE_LABELS = ["complies", "deviates", "unclear"] as const;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 45_000;

interface HFResponse {
  labels: string[];
  scores: number[];
  sequence: string;
}

interface HFLoadingError {
  error: string;
  estimated_time?: number;
}

async function callHuggingFace(
  action: string,
  guideline: string,
  attempt = 1
): Promise<HFResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Reported action: ${action}\nProcess standard: ${guideline}`,
        parameters: {
          candidate_labels: CANDIDATE_LABELS,
          hypothesis_template:
            "The described action {} the stated process standard.",
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
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      return callHuggingFace(action, guideline, attempt + 1);
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

function mapResult(hfResponse: HFResponse): {
  result: ComplianceResult;
  confidence: number;
} {
  const topIndex = hfResponse.scores.indexOf(Math.max(...hfResponse.scores));
  const topLabel = hfResponse.labels[topIndex].toUpperCase();
  const confidence = hfResponse.scores[topIndex];

  const result: ComplianceResult =
    topLabel === "COMPLIES" || topLabel === "DEVIATES" || topLabel === "UNCLEAR"
      ? topLabel
      : "UNCLEAR";

  return { result, confidence };
}

export async function runAnalysis(data: {
  userId: string;
  action: string;
  guideline: string;
}) {
  const hfResponse = await callHuggingFace(data.action, data.guideline);
  const { result, confidence } = mapResult(hfResponse);

  return createAnalysis({
    userId: data.userId,
    action: data.action,
    guideline: data.guideline,
    result,
    confidence,
  });
}

export async function rerunAnalysis(data: {
  id: string;
  userId: string;
  action: string;
  guideline: string;
}) {
  const hfResponse = await callHuggingFace(data.action, data.guideline);
  const { result, confidence } = mapResult(hfResponse);

  return updateAnalysis(data.id, data.userId, {
    action: data.action,
    guideline: data.guideline,
    result,
    confidence,
  });
}
