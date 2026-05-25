import { auth } from "@clerk/nextjs/server";
import { getAnalyses } from "@/server/repositories/analysis";
import type { ApiError } from "@/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" } satisfies ApiError,
      { status: 401 }
    );
  }

  try {
    const analyses = await getAnalyses(userId);
    return Response.json(analyses);
  } catch (err) {
    console.error("GET /api/analyses error:", err);
    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" } satisfies ApiError,
      { status: 500 }
    );
  }
}
