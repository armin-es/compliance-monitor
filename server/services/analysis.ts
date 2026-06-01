import "server-only";
import { env } from "@/lib/env";
import { callHuggingFace, mapResult, HuggingFaceError } from "@/lib/huggingface";
import {
  createAnalysis,
  updateAnalysis,
} from "@/server/repositories/analysis";

export { HuggingFaceError, mapResult };

export async function runAnalysis(data: {
  orgId: string;
  userId: string;
  action: string;
  guideline: string;
}) {
  const hfResponse = await callHuggingFace(data.action, data.guideline, env.HUGGINGFACE_API_TOKEN);
  const { result, confidence } = mapResult(hfResponse);

  return createAnalysis({
    orgId: data.orgId,
    userId: data.userId,
    action: data.action,
    guideline: data.guideline,
    result,
    confidence,
  });
}

export async function rerunAnalysis(data: {
  id: string;
  orgId: string;
  userId: string;
  action: string;
  guideline: string;
}) {
  const hfResponse = await callHuggingFace(data.action, data.guideline, env.HUGGINGFACE_API_TOKEN);
  const { result, confidence } = mapResult(hfResponse);

  return updateAnalysis(data.id, data.orgId, {
    action: data.action,
    guideline: data.guideline,
    result,
    confidence,
  });
}
