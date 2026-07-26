import { expect, test } from "@playwright/test";

test("owner generates and regenerates one saved AI plan", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `atomic-plan+${stamp}@commitbet.test`;
  const projectName = `Atomic plan ${stamp}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Atomic Plan Owner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /your commitments/i })).toBeVisible();

  await page.goto("/app/teams");
  await page.getByLabel("Team name").fill(`Atomic Team ${stamp}`);
  await page.getByRole("button", { name: /^create team$/i }).click();

  await page.getByRole("link", { name: /new project/i }).click();
  await page.getByLabel("Project name").fill(projectName);
  await page.getByLabel("Description").fill("Verify atomic AI plan persistence through the owner UI.");
  await page.getByLabel("Main goal").fill("Generate one valid plan and safely replace it once.");

  await page.getByRole("button", { name: /^continue/i }).click();
  await page.getByRole("button", { name: /^continue/i }).click();
  await page.getByRole("button", { name: /^continue/i }).click();
  await page.getByRole("button", { name: /^software development/i }).click();
  await page.getByRole("button", { name: /^continue/i }).click();
  await page.getByRole("button", { name: /^continue/i }).click();
  await page.getByRole("button", { name: /^continue/i }).click();

  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  const generate = page.getByRole("button", { name: /^generate ai plan$/i }).first();
  await generate.click();
  await expect(page.getByText("AI plan saved.")).toBeVisible();
  await expect(page.getByRole("link", { name: /define the delivery checklist/i })).toHaveCount(1);

  const regenerated = page.waitForResponse(
    (response) =>
      response.request().method() === "POST"
      && response.url() === page.url(),
  );
  await page.getByRole("button", { name: /^regenerate ai plan$/i }).click();
  await regenerated;
  await expect(page.getByText("AI plan saved.")).toBeVisible();
  await expect(page.getByRole("link", { name: /define the delivery checklist/i })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /start project with this plan/i }).first()).toBeEnabled();
});
