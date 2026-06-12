import { devices, expect, test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";

test("teammate rejection can be disputed and resolved by the owner", async ({ browser, page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const ownerName = `Owner ${stamp}`;
  const reviewerName = `Reviewer ${stamp}`;
  const taskTitle = "Build the core working result";

  await page.goto("/register");
  await page.getByLabel("Name").fill(ownerName);
  await page.getByLabel("Email").fill(`owner+${stamp}@commitbet.test`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /your commitments/i })).toBeVisible();

  await page.goto("/app/teams");
  await page.getByLabel("Team name").fill(`Review Team ${stamp}`);
  await page.getByRole("button", { name: /^create team$/i }).click();
  const inviteText = await page.getByText(/Invite code:/i).textContent();
  const inviteCode = inviteText?.match(/[A-Z0-9]{8}/)?.[0];
  expect(inviteCode).toBeTruthy();

  const reviewerContext = await browser.newContext({ ...devices["Pixel 5"] });
  const reviewerPage = await reviewerContext.newPage();
  try {
    await reviewerPage.goto(`${baseUrl}/register`);
    await reviewerPage.getByLabel("Name").fill(reviewerName);
    await reviewerPage.getByLabel("Email").fill(`reviewer+${stamp}@commitbet.test`);
    await reviewerPage.getByLabel("Password").fill("password123");
    await reviewerPage.getByRole("button", { name: /create account/i }).click();
    await expect(reviewerPage.getByRole("heading", { name: /your commitments/i })).toBeVisible();
    await reviewerPage.goto(`${baseUrl}/app/teams`);
    await reviewerPage.getByLabel("Invite code").fill(inviteCode!);
    await reviewerPage.getByRole("button", { name: /join team/i }).click();
    await expect(reviewerPage.getByRole("heading", { name: new RegExp(`Review Team ${stamp}`) })).toBeVisible();

    await page.getByRole("link", { name: /new project/i }).click();
    await page.getByLabel("Title").fill(`Peer review project ${stamp}`);
    await page.getByLabel("Description").fill("Exercise peer review and dispute resolution.");
    await page.getByLabel("Main goal").fill("Verify the human review workflow end to end.");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();

    const ownerProfile = page.getByRole("group", { name: ownerName });
    await ownerProfile.getByLabel("Strengths").fill("implementation");
    await ownerProfile.getByLabel("Preferred work").fill("development");
    const reviewerProfile = page.getByRole("group", { name: reviewerName });
    await reviewerProfile.getByLabel("Strengths").fill("quality assurance");
    await reviewerProfile.getByLabel("Preferred work").fill("review");

    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /create draft/i }).click();
    await page.getByRole("button", { name: /generate ai plan/i }).click();
    await page.getByRole("button", { name: /confirm and start project/i }).click();

    const ownerTaskLink = page.getByRole("link").filter({ hasText: taskTitle });
    await expect(ownerTaskLink).toBeVisible();
    await ownerTaskLink.click();
    const taskUrl = page.url();
    await page.getByRole("button", { name: /mark in progress/i }).click();
    await page.getByLabel("Description").fill("Working result is available for review.");
    await page.getByLabel("Link (optional)", { exact: true }).fill("https://example.com/result");
    await page.getByRole("button", { name: /add evidence/i }).click();
    await page.getByRole("button", { name: /submit for review/i }).click();

    await reviewerPage.goto(`${baseUrl}/app/approvals`);
    await reviewerPage.getByRole("link").filter({ hasText: taskTitle }).click();
    await reviewerPage.getByLabel("Decision").selectOption("rejected");
    await reviewerPage.getByLabel("Comment").fill("The demo does not yet show every acceptance criterion.");
    await reviewerPage.getByRole("button", { name: /submit review/i }).click();
    await expect(reviewerPage.getByText(/rejected/i).first()).toBeVisible();

    await page.goto(taskUrl);
    await page.getByLabel("Reason").fill("The evidence demonstrates the working result.");
    await page.getByLabel("Your explanation").fill("The implementation is functional and the linked demo is reviewable.");
    await page.getByRole("button", { name: /request ai recommendation/i }).click();
    await expect(page.getByRole("heading", { name: /ai recommendation/i })).toBeVisible();
    await page.getByRole("button", { name: /confirm resolution/i }).click();
    await expect(page.getByText(/approved/i).first()).toBeVisible();
  } finally {
    await reviewerContext.close();
  }
});
