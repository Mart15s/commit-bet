import { expect, test } from "@playwright/test";
test("landing page offers an honest walkthrough and labeled sample content", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Finish what you start. Together." }),
  ).toBeVisible();
  await expect(
    page.getByText("Illustrative product preview · sample data"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See how it works" }),
  ).toHaveAttribute("href", "#how-it-works");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(
    page
      .getByText("Commitment points are virtual and have no monetary value.")
      .first(),
  ).toBeVisible();
});
