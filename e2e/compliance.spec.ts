import { test, expect, type Page } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { Client } from "pg";

test.beforeAll(async () => {
  await clerkSetup();
});

test.beforeEach(async ({ page }) => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('DELETE FROM "Analysis"');
  } finally {
    await db.end();
  }

  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL! });
  await page.goto("/");
  await page.getByTestId("open-check-dialog").waitFor({ state: "visible", timeout: 20_000 });
});

async function openDialog(page: Page) {
  await page.getByTestId("open-check-dialog").click();
}

async function closeDialog(page: Page) {
  await page.getByTestId("done-button").click();
}

test("submits a compliant action and shows COMPLIES", async ({ page }) => {
  await openDialog(page);

  await page.getByTestId("action-input").fill(
    "Closed ticket #48219 and sent confirmation email"
  );
  await page.getByTestId("guideline-input").fill(
    "All closed tickets must include a confirmation email"
  );
  await page.getByTestId("submit-button").click();

  await expect(page.getByTestId("result-panel")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId("result-panel")).toContainText("COMPLIES");

  await closeDialog(page);

  await expect(page.getByTestId("history-list")).toBeVisible();
  await expect(
    page.getByTestId("history-item").first()
  ).toContainText("Closed ticket #48219");
});

test("submits a deviating action and shows DEVIATES", async ({ page }) => {
  await openDialog(page);

  await page.getByTestId("action-input").fill(
    "Closed ticket #48219 without sending confirmation email"
  );
  await page.getByTestId("guideline-input").fill(
    "All closed tickets must include a confirmation email"
  );
  await page.getByTestId("submit-button").click();

  await expect(page.getByTestId("result-panel")).toContainText("DEVIATES", {
    timeout: 60_000,
  });

  await closeDialog(page);

  await expect(page.getByTestId("history-item").first()).toContainText(
    "without sending confirmation email"
  );
});

test("persists compliance log across page reload", async ({ page }) => {
  await openDialog(page);

  await page.getByTestId("action-input").fill("Rebooted the server and checked logs");
  await page.getByTestId("guideline-input").fill(
    "Servers must be rebooted weekly and logs reviewed after restart"
  );
  await page.getByTestId("submit-button").click();

  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 60_000 });

  await page.reload();
  await expect(page.getByTestId("history-item").first()).toContainText(
    "Rebooted the server"
  );
});

test("edits a log entry and updates the result", async ({ page }) => {
  await openDialog(page);

  await page.getByTestId("action-input").fill(
    "Closed ticket #48219 and sent confirmation email"
  );
  await page.getByTestId("guideline-input").fill(
    "All closed tickets must include a confirmation email"
  );
  await page.getByTestId("submit-button").click();
  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 60_000 });

  await closeDialog(page);

  await page.getByTestId("edit-button").first().click();

  await page.getByTestId("action-input").clear();
  await page.getByTestId("action-input").fill(
    "Closed ticket #48219 without sending confirmation email"
  );
  await page.getByTestId("submit-button").click();

  await expect(page.getByTestId("result-panel")).toContainText("DEVIATES", {
    timeout: 60_000,
  });
});

test("soft-deletes an entry from the compliance log", async ({ page }) => {
  await openDialog(page);

  await page.getByTestId("action-input").fill("Test action to be deleted");
  await page.getByTestId("guideline-input").fill("Some test guideline");
  await page.getByTestId("submit-button").click();
  await expect(page.getByTestId("result-panel")).toBeVisible({ timeout: 60_000 });

  await closeDialog(page);

  const initialCount = await page.getByTestId("history-item").count();

  await page.getByTestId("delete-button").first().click();
  await page.getByTestId("confirm-delete-button").click();

  await expect(page.getByTestId("history-item")).toHaveCount(initialCount - 1);

  await page.reload();
  await expect(page.getByTestId("history-item")).toHaveCount(initialCount - 1);
});
