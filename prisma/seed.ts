import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const userId = process.env.SEED_USER_ID;
const orgId = process.env.SEED_ORG_ID;
if (!userId || !orgId) {
  console.error("SEED_USER_ID and SEED_ORG_ID env vars are required. See README for instructions.");
  process.exit(1);
}
const seedUserId = userId as string;
const seedOrgId = orgId as string;

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
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Reported action: ${item.action}\nProcess standard: ${item.guideline}`,
          parameters: {
            candidate_labels: ["complies", "deviates", "unclear"],
            hypothesis_template:
              "The described action {} the stated process standard.",
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`HF API error for "${item.action}", skipping`);
      continue;
    }

    const data = (await response.json()) as { label: string; score: number }[];

    const top = data[0];
    const result = (top?.label ?? "unclear").toUpperCase() as
      | "COMPLIES"
      | "DEVIATES"
      | "UNCLEAR";
    const confidence = top?.score ?? 0;

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
