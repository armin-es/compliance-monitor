import { z } from "zod";

export const analysisRequestSchema = z.object({
  action: z.string().min(1, "Reported action is required").max(2000),
  guideline: z.string().max(2000).optional().default(""),
});

export const analysisIdSchema = z.object({
  id: z.string().min(1),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
