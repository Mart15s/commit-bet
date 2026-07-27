import { devices, expect, test } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";

test("teammate rejection can be disputed and resolved by the owner", async ({ browser, page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const ownerName = `Owner ${stamp}`;
  const reviewerName = `Reviewer ${stamp}`;

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
    await page.getByLabel("Project name").fill(`Peer review project ${stamp}`);
    await page.getByLabel("Description").fill("Exercise peer review and dispute resolution.");
    await page.getByLabel("Main goal").fill("Verify the human review workflow end to end.");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /how will you know it worked/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /when is the finish line/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /member setup/i }).first()).toBeVisible();
    const ownerProfile = page.getByRole("checkbox", { name: new RegExp(ownerName) }).locator("xpath=ancestor::fieldset[1]");
    await ownerProfile.getByRole("button", { name: /^software development/i }).click();
    const reviewerProfile = page.getByRole("checkbox", { name: new RegExp(reviewerName) }).locator("xpath=ancestor::fieldset[1]");
    await reviewerProfile.getByRole("button", { name: /^software development/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /pledge points/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /let ai create your action plan/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: /review everything before starting/i }).first()).toBeVisible();
    await page
      .getByRole("button", { name: /create draft commitment/i })
      .evaluate((button: HTMLButtonElement) => button.click());
    await page.getByRole("button", { name: /generate ai plan/i }).first().click();
    await page.getByRole("button", { name: /start project with this plan/i }).first().click();

    const ownerTaskLink = page.getByRole("link").filter({ hasText: ownerName }).first();
    await expect(ownerTaskLink).toBeVisible();
    const taskTitle = (await ownerTaskLink.getByRole("heading").textContent())!;
    await ownerTaskLink.click();
    await page.waitForURL(/\/app\/tasks\//);
    await expect(page.getByRole("heading", { name: taskTitle })).toBeVisible();
    const taskUrl = page.url();
    await page.getByRole("button", { name: /mark in progress/i }).click();
    await page.getByLabel("What does this prove?").fill("Working result is available for review.");
    await page.getByLabel("Proof link (optional)", { exact: true }).fill("https://example.com/result");
    await page.getByRole("button", { name: /add proof of work/i }).click();
    await page.getByRole("button", { name: /submit for review/i }).click();
    await expect(page.getByText(/submitted/i).first()).toBeVisible();

    await reviewerPage.goto(`${baseUrl}/app/approvals`);
    await expect(reviewerPage.getByRole("heading", { name: taskTitle })).toBeVisible();
    await reviewerPage.getByLabel("Reviewer note").fill("The demo does not yet show every acceptance criterion.");
    await reviewerPage.getByRole("button", { name: /reject proof/i }).click();
    await expect(reviewerPage.getByRole("heading", { name: /nothing to review yet/i })).toBeVisible();

    await page.goto(taskUrl);
    await page.getByLabel("Reason").fill("The evidence demonstrates the working result.");
    await page.getByLabel("Your explanation").fill("The implementation is functional and the linked demo is reviewable.");
    await page.getByRole("button", { name: /ask ai to structure the dispute/i }).click();
    await expect(page.getByRole("heading", { name: /ai recommendation/i })).toBeVisible();
    await page.getByRole("button", { name: /confirm human resolution/i }).click();
    await expect(page.getByText(/approved/i).first()).toBeVisible();
  } finally {
    await reviewerContext.close();
  }
});
