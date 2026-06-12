import { expect, test } from "@playwright/test";

test("mobile landing page exposes the MVP promise", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /stop abandoning projects/i })).toBeVisible();
  await expect(page.getByText(/No real payments/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /start a commitment sprint/i })).toBeVisible();
});

