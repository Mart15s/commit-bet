import { expect, test } from "@playwright/test";
test("landing page offers authentic branding and an honest proof workflow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Ship or explain\./ }),
  ).toBeVisible();
  await expect(
    page.getByText("A workflow, not a claimed result. Uploading evidence does not make it verified."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See how it works" }),
  ).toHaveAttribute("href", "#how-it-works");
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(
    page
      .getByText(/Public Beta does not accept, hold or distribute real pledge money/)
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a commitment" }).first()).toHaveAttribute("href", "/register");
  await expect(page.getByAltText("5GieAEOU").first()).toHaveAttribute("src", /\/brand\//);
});
