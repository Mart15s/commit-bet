import { expect, test } from "@playwright/test";

test("mobile mocked sprint setup through task submission", async ({ page }) => {
  const stamp = Date.now();
  const email = `martynas+${stamp}@commitbet.test`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Martynas");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /your commitments/i })).toBeVisible();

  await page.goto("/app/teams");
  await page.getByLabel("Team name").fill(`MVP Team ${stamp}`);
  await page.getByRole("button", { name: /^create team$/i }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`MVP Team ${stamp}`) })).toBeVisible();

  await page.getByRole("link", { name: /new project/i }).click();
  await page.getByLabel("Title").fill("Build a landing page and waitlist in 7 days");
  await page.getByLabel("Description").fill("Create a working mobile-first landing page with a waitlist capture flow.");
  await page.getByLabel("Main goal").fill("Ship a landing page that collects waitlist signups and can be shown in a demo.");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel("Strengths").fill("programming, backend, AI integrations");
  await page.getByLabel("Weaknesses").fill("marketing");
  await page.getByLabel("Preferred work").fill("development, testing");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /create draft/i }).click();

  await expect(page.getByRole("heading", { name: /build a landing page/i })).toBeVisible();
  await page.getByRole("button", { name: /generate ai plan/i }).click();
  await expect(page.getByRole("button", { name: /confirm and start project/i })).toBeVisible();
  await page.getByRole("button", { name: /confirm and start project/i }).click();
  await expect(page.getByText(/active/i).first()).toBeVisible();

  await page.getByText("Define the delivery checklist").click();
  await expect(page.getByRole("heading", { name: /define the delivery checklist/i })).toBeVisible();
  await page.getByRole("button", { name: /mark in progress/i }).click();
  await page.getByLabel("Description").fill("Shared checklist covers every success criterion and is ready for review.");
  await page.getByLabel("Link (optional)", { exact: true }).fill("https://example.com/checklist");
  await page.getByRole("button", { name: /add evidence/i }).click();
  await expect(page.getByText(/1\)/).or(page.getByText(/Evidence \(1\)/))).toBeVisible();
  await page.getByRole("button", { name: /submit for review/i }).click();
  await expect(page.getByText(/submitted/i).first()).toBeVisible();

  await page.getByRole("link", { name: /back to project/i }).click();
  await page.getByRole("link", { name: /final report/i }).click();
  await page.getByRole("button", { name: /generate final report/i }).click();
  await expect(page.getByRole("heading", { name: /ai summary/i })).toBeVisible();
  await page.locator('input[name="human_confirmation"]').check();
  await page.getByRole("button", { name: /confirm final decision/i }).click();
  await expect(page.getByRole("heading", { name: /human decision confirmed/i })).toBeVisible();
});
