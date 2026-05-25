import { auth } from "@clerk/nextjs/server";
import { analysisRequestSchema } from "@/lib/validations";
import { rerunAnalysis } from "@/server/services/analysis";
import { softDeleteAnalysis } from "@/server/repositories/analysis";
import { HuggingFaceError } from "@/server/services/analysis";
import type { ApiError } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" } satisfies ApiError,
      { status: 401 }
    );
  }

  const { id } = await params;
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
    const updated = await rerunAnalysis({
      id,
      userId,
      action: parsed.data.action,
      guideline: parsed.data.guideline,
    });

    if (!updated) {
      return Response.json(
        { error: "Analysis not found", code: "NOT_FOUND" } satisfies ApiError,
        { status: 404 }
      );
    }

    return Response.json(updated);
  } catch (err) {
    if (err instanceof HuggingFaceError) {
      if (err.code === "MODEL_UNAVAILABLE" || err.code === "TIMEOUT") {
        return Response.json(
          { error: err.message, code: "MODEL_UNAVAILABLE" } satisfies ApiError,
          { status: 503 }
        );
      }
    }
    console.error(`PATCH /api/analyses/${id} error:`, err);
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" } satisfies ApiError,
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" } satisfies ApiError,
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const deleted = await softDeleteAnalysis(id, userId);
    if (!deleted) {
      return Response.json(
        { error: "Analysis not found", code: "NOT_FOUND" } satisfies ApiError,
        { status: 404 }
      );
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(`DELETE /api/analyses/${id} error:`, err);
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" } satisfies ApiError,
      { status: 500 }
    );
  }
}
