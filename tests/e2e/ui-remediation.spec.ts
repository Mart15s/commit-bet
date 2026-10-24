import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
const fixture = "http://127.0.0.1:3100";
const widths = [320, 375, 390, 768, 1024, 1440];

for (const language of ["en", "lt"])
  for (const width of widths) {
    test(`responsive UI ${language} at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (language) => localStorage.setItem("commitbet.language", language),
        language,
      );
      for (const view of [
        "landing",
        "login",
        "dashboard",
        "empty",
        "log",
        "wizard",
        "review",
      ]) {
        await page.goto(
          view === "landing"
            ? "/"
            : view === "login"
              ? "/login"
              : `${fixture}/?view=${view}`,
        );
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator("body")).not.toContainText("undefined");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        if ([390, 1440].includes(width)) {
          await fs.mkdir("audit-evidence", { recursive: true });
          await page.screenshot({
            path: `audit-evidence/${view}-${language}-${width}.png`,
            fullPage: true,
          });
        }
        if (
          ["dashboard", "empty", "log", "wizard", "review"].includes(view) &&
          width < 1024
        ) {
          const nav = page
            .getByRole("navigation", {
              name:
                language === "lt" ? "Pagrindinė navigacija" : "Main navigation",
            })
            .last();
          await expect(nav).toBeVisible();
          expect(await nav.getByRole("link").count()).toBe(4);
          if (["log", "wizard"].includes(view)) {
            const dock = page.locator(".submit-dock");
            await dock.scrollIntoViewIfNeeded();
            const buttonBox = await dock.boundingBox();
            const navBox = await nav.boundingBox();
            expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(
              navBox!.y,
            );
          }
        }
      }
      expect(errors).toEqual([]);
    });
  }

test("mobile navigation exposes routes, active state, and a keyboard-accessible More dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto(`${fixture}/app/projects?view=dashboard`);
  const nav = page.getByRole("navigation", { name: "Main navigation" }).last();
  await expect(nav.getByRole("link", { name: "Sprints" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Log today" })).toHaveAttribute(
    "href",
    "/app/logs/new",
  );
  await nav.getByRole("button", { name: "More" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (const path of [
    "/app/teams",
    "/app/projects/new",
    "/app/profile",
    "/app/settings",
  ])
    await expect(dialog.locator(`a[href="${path}"]`)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Close menu" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(nav.getByRole("button", { name: "More" })).toBeFocused();
});

test("new-user dashboard is honest and has one primary onboarding action", async ({
  page,
}) => {
  await page.goto(`${fixture}/?view=empty`);
  await expect(
    page.getByRole("heading", { name: "Finish something together." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create or join a team" }),
  ).toHaveAttribute("href", "/app/teams");
  await expect(page.getByText("AI risk insight")).toHaveCount(0);
  await expect(page.getByText("180")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("daily logging preserves input after failure, prevents duplicates, and confirms success", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${fixture}/?view=log`);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('a[href*="#evidence-upload"]')).toHaveAttribute(
    "href",
    /\/app\/tasks\/.*#evidence-upload/,
  );
  const summary = page.getByRole("textbox", { name: /what changed today/i });
  await summary.fill("fail recoverable network test");
  await page.getByRole("button", { name: "Save daily progress" }).click();
  await expect(
    page.getByRole("button", { name: "Saving progress…" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(
    "Your input is still here",
  );
  await expect(summary).toHaveValue("fail recoverable network test");
  await summary.fill("Finished the mobile signup flow.");
  await page.getByRole("button", { name: "Save daily progress" }).click();
  await expect(
    page.getByRole("heading", { name: "Progress saved" }),
  ).toBeVisible();
});

test("seven-step wizard validates early and labels its plan example", async ({
  page,
}) => {
  await page.goto(`${fixture}/?view=wizard`);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert")).toContainText("project name");
  await page
    .getByLabel("Project name")
    .fill("Publish a verified mobile signup flow");
  await page
    .getByLabel("Description", { exact: false })
    .fill("A working signup flow for the first five teams.");
  await page
    .getByLabel("Main goal")
    .fill("Store one test signup and share the demo link.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByText(/Example: Publish the signup page/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /^Software development/i }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Illustrative plan example")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Sprint at a glance")).toBeVisible();
  await expect(
    page.getByText("Publish a verified mobile signup flow"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /create draft commitment/i }),
  ).toBeEnabled();
});

test("peer approval requires evidence acknowledgement and rejection requires a deliberate second step", async ({
  page,
}) => {
  await page.goto(`${fixture}/?view=review`);
  const approve = page.getByRole("button", { name: "Approve work" });
  await expect(approve).toBeDisabled();
  await page
    .getByLabel("I checked the evidence against the acceptance criteria.")
    .check();
  await expect(approve).toBeEnabled();
  await page.getByRole("button", { name: "Reject proof…" }).click();
  await expect(
    page.getByRole("button", { name: "Confirm rejection" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm rejection" }),
  ).toHaveCount(0);
});
