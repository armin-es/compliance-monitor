import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { callHuggingFace, mapResult } from "../lib/huggingface";

const userId = process.env.SEED_USER_ID;
const orgId = process.env.SEED_ORG_ID;
const token = process.env.HUGGINGFACE_API_TOKEN;

if (!userId || !orgId || !token) {
  console.error("SEED_USER_ID, SEED_ORG_ID, and HUGGINGFACE_API_TOKEN env vars are required. See README for instructions.");
  process.exit(1);
}

const seedUserId = userId as string;
const seedOrgId = orgId as string;
const seedToken = token as string;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const seedData = [
  {
    action: "Closed ticket #48219 and sent confirmation email",
    guideline: "All closed tickets must include a confirmation email",
  },
  {
    action: "Closed ticket #48219 without sending confirmation email",
    guideline: "All closed tickets must include a confirmation email",
  },
  {
    action: "Rebooted the server and checked logs",
    guideline: "Servers must be rebooted weekly and logs reviewed after restart",
  },
  {
    action: "Skipped torque confirmation at Station 3",
    guideline: "",
  },
];

async function main() {
  console.log("Seeding database with example compliance checks...");

  for (const item of seedData) {
    let result: "COMPLIES" | "DEVIATES" | "UNCLEAR";
    let confidence: number;

    try {
      const hfResponse = await callHuggingFace(item.action, item.guideline, seedToken);
      ({ result, confidence } = mapResult(hfResponse));
    } catch (err) {
      console.warn(`HF API error for "${item.action}", skipping:`, err);
      continue;
    }

    await db.analysis.create({
      data: {
        orgId: seedOrgId,
        userId: seedUserId,
        action: item.action,
        guideline: item.guideline,
        result,
        confidence,
      },
    });

    console.log(`✓ ${item.action.slice(0, 50)}... -> ${result} (${Math.round(confidence * 100)}%)`);
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
