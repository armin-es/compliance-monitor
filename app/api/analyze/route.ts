import { auth } from "@clerk/nextjs/server";
import { analysisRequestSchema } from "@/lib/validations";
import { runAnalysis, HuggingFaceError } from "@/server/services/analysis";
import type { ApiError } from "@/types";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" } satisfies ApiError,
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = analysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request",
        code: "VALIDATION_ERROR",
      } satisfies ApiError,
      { status: 400 }
    );
  }

  try {
    const analysis = await runAnalysis({
      userId,
      action: parsed.data.action,
      guideline: parsed.data.guideline,
    });
    return Response.json(analysis, { status: 201 });
  } catch (err) {
    if (err instanceof HuggingFaceError) {
      if (err.code === "MODEL_UNAVAILABLE" || err.code === "TIMEOUT") {
        return Response.json(
          { error: err.message, code: "MODEL_UNAVAILABLE" } satisfies ApiError,
          { status: 503 }
        );
      }
    }
    console.error("POST /api/analyze error:", err);
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" } satisfies ApiError,
      { status: 500 }
    );
  }
}
