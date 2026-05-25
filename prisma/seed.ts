import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const userId = process.env.SEED_USER_ID;
if (!userId) {
  console.error("SEED_USER_ID env var is required. See README for instructions.");
  process.exit(1);
}
const seedUserId = userId as string;

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = dbUrl.replace(/^file:/, "");
const adapter = new PrismaBetterSqlite3({ url: filePath });
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
  console.log("Seeding database with spec test cases…");

  for (const item of seedData) {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/facebook/bart-large-mnli`,
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
      console.warn(`HF API error for "${item.action}" — skipping`);
      continue;
    }

    const data = (await response.json()) as {
      labels: string[];
      scores: number[];
    };

    const topIndex = data.scores.indexOf(Math.max(...data.scores));
    const result = (data.labels[topIndex] ?? "unclear").toUpperCase() as
      | "COMPLIES"
      | "DEVIATES"
      | "UNCLEAR";
    const confidence = data.scores[topIndex] ?? 0;

    await db.analysis.create({
      data: {
        userId: seedUserId,
        action: item.action,
        guideline: item.guideline,
        result,
        confidence,
      },
    });

    console.log(`✓ ${item.action.slice(0, 50)}… → ${result} (${Math.round(confidence * 100)}%)`);
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
