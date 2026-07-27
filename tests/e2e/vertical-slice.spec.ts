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
  await page.getByLabel("Project name").fill("Build a landing page and waitlist in 7 days");
  await page.getByLabel("Description").fill("Create a working mobile-first landing page with a waitlist capture flow.");
  await page.getByLabel("Main goal").fill("Ship a landing page that collects waitlist signups and can be shown in a demo.");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /how will you know it worked/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /when is the finish line/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /member setup/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /^software development/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /pledge points/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /let ai create your action plan/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /review everything before starting/i }).first()).toBeVisible();
  await page
    .getByRole("button", { name: /create draft commitment/i })
    .evaluate((button: HTMLButtonElement) => button.click());

  await expect(page.getByRole("heading", { name: /build a landing page/i })).toBeVisible();
  await page.getByRole("button", { name: /generate ai plan/i }).first().click();
  await expect(page.getByRole("button", { name: /start project with this plan/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /start project with this plan/i }).first().click();
  await expect(page.getByText(/active/i).first()).toBeVisible();

  await page.getByText("Define the delivery checklist").click();
  await expect(page.getByRole("heading", { name: /define the delivery checklist/i })).toBeVisible();
  await page.getByRole("button", { name: /mark in progress/i }).click();
  await page.getByLabel("What does this prove?").fill("Shared checklist covers every success criterion and is ready for review.");
  await page.getByLabel("Proof link (optional)", { exact: true }).fill("https://example.com/checklist");
  await page.getByRole("button", { name: /add proof of work/i }).click();
  await expect(page.getByRole("heading", { name: /Evidence \(1\)/ })).toBeVisible();
  await page.getByRole("button", { name: /submit for review/i }).click();
  await expect(page.getByText(/submitted/i).first()).toBeVisible();

  await page.getByRole("link", { name: /back to project/i }).click();
  await page.getByRole("link", { name: /final report/i }).click();
  await page.getByRole("button", { name: /generate final report/i }).click();
  await expect(page.getByText("AI recommendation", { exact: true })).toBeVisible();
  await page.locator('input[name="human_confirmation"]').check();
  await page.getByRole("button", { name: /confirm final outcome/i }).evaluate(
    (button: HTMLButtonElement) => {
      button.click();
      button.click();
    },
  );
  await expect(page.getByRole("heading", { name: /human decision confirmed/i })).toBeVisible();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /confirm final outcome/i })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: /human decision confirmed/i })).toHaveCount(1);
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /confirm final outcome/i })).toHaveCount(0);
});
