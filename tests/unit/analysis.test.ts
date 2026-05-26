import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { HUGGINGFACE_API_TOKEN: "hf_test" } }));
vi.mock("@/server/repositories/analysis", () => ({
  createAnalysis: vi.fn(),
  updateAnalysis: vi.fn(),
}));

import { mapResult, HuggingFaceError, runAnalysis } from "@/server/services/analysis";
import { createAnalysis } from "@/server/repositories/analysis";
import type { Analysis } from "@/types";

const STUB_ANALYSIS = {
  id: "c1",
  userId: "u1",
  action: "action",
  guideline: "guideline",
  result: "COMPLIES" as const,
  confidence: 0.92,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies Analysis;

describe("mapResult", () => {
  it("returns COMPLIES when top label is complies", () => {
    expect(mapResult([{ label: "complies", score: 0.92 }])).toEqual({
      result: "COMPLIES",
      confidence: 0.92,
    });
  });

  it("returns DEVIATES when top label is deviates", () => {
    expect(mapResult([{ label: "deviates", score: 0.88 }])).toEqual({
      result: "DEVIATES",
      confidence: 0.88,
    });
  });

  it("returns UNCLEAR when top label is unclear", () => {
    expect(mapResult([{ label: "unclear", score: 0.6 }])).toEqual({
      result: "UNCLEAR",
      confidence: 0.6,
    });
  });

  it("defaults to UNCLEAR for unrecognized labels", () => {
    expect(mapResult([{ label: "unknown", score: 0.5 }])).toEqual({
      result: "UNCLEAR",
      confidence: 0.5,
    });
  });

  it("defaults to UNCLEAR with zero confidence on empty response", () => {
    expect(mapResult([])).toEqual({ result: "UNCLEAR", confidence: 0 });
  });
});

describe("runAnalysis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls HuggingFace and persists the result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          { label: "complies", score: 0.92 },
          { label: "deviates", score: 0.05 },
          { label: "unclear", score: 0.03 },
        ],
      })
    );
    vi.mocked(createAnalysis).mockResolvedValueOnce(STUB_ANALYSIS);

    const promise = runAnalysis({ userId: "u1", action: "action", guideline: "guideline" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetch).toHaveBeenCalledOnce();
    expect(createAnalysis).toHaveBeenCalledWith({
      userId: "u1",
      action: "action",
      guideline: "guideline",
      result: "COMPLIES",
      confidence: 0.92,
    });
    expect(result).toBe(STUB_ANALYSIS);
  });

  it("retries on 503 and succeeds on the next attempt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          status: 503,
          ok: false,
          json: async () => ({ error: "loading" }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => [{ label: "complies", score: 0.9 }],
        })
    );
    vi.mocked(createAnalysis).mockResolvedValueOnce(STUB_ANALYSIS);

    const promise = runAnalysis({ userId: "u1", action: "action", guideline: "guideline" });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe(STUB_ANALYSIS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws MODEL_UNAVAILABLE after all retries are exhausted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({ error: "loading" }),
      })
    );

    const promise = runAnalysis({ userId: "u1", action: "action", guideline: "guideline" });
    const caught = promise.catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    const error = await caught;
    expect(error).toBeInstanceOf(HuggingFaceError);
    expect((error as HuggingFaceError).code).toBe("MODEL_UNAVAILABLE");
  });

  it("throws TIMEOUT when the request exceeds 45 seconds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      })
    );

    const promise = runAnalysis({ userId: "u1", action: "action", guideline: "guideline" });
    const caught = promise.catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    const error = await caught;
    expect(error).toBeInstanceOf(HuggingFaceError);
    expect((error as HuggingFaceError).code).toBe("TIMEOUT");
  });
});
