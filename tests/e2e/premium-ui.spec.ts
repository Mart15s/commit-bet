import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

const fixture = "http://127.0.0.1:3100";

test("released public pages retain locale, real navigation, redirects and the example label", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const dir = process.env.PLAYWRIGHT_SCREENSHOT_DIR || ".agent-runtime/premium-ui";
  await fs.mkdir(dir, { recursive: true });
  for (const width of [375, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("figure", { name: /Illustrative 14-day sprint/ })).toBeVisible();
    await expect(page.getByText("Illustrative example", { exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${dir}/hero-final-${width}.png` });
  }
  await page.getByRole("button", { name: "Lietuvių", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "lt");
  await expect(page.getByRole("heading", { name: "Nuo pažado iki kodo.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await page.goto("/register");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  const missing = await page.goto("/page-that-does-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Back to home", exact: true })).toHaveAttribute("href", "/");
  expect(errors).toEqual([]);
});

test("desktop More opens a compact anchored dialog and returns keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${fixture}/?view=dashboard`);
  const trigger = page.getByRole("button", { name: "More", exact: true }).filter({ visible: true });
  await trigger.click();
  const menu = page.getByRole("dialog");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(menu.getByRole("button", { name: "Close menu" })).toBeFocused();
  const box = await menu.boundingBox();
  expect(box!.width).toBeLessThan(350);
  expect(box!.y).toBeLessThan(110);
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("draft is directly actionable without pretending to be active", async ({ page }) => {
  await page.goto(`${fixture}/?view=draft`);
  await expect(page.getByRole("link", { name: /Continue setup/ }).first()).toHaveAttribute("href", /\/app\/projects\/[^/]+#plan/);
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("180", { exact: true })).toHaveCount(0);
});

test("failed authorized data load is not rendered as an empty workspace", async ({ page }) => {
  await page.goto(`${fixture}/?view=failed`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByText("Finish something together.")).toHaveCount(0);
});

for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  test(`project sections and board stay usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${fixture}/?view=project`);
    const tabs = page.getByRole("tablist", { name: "Project sections" });
    await expect(page.getByRole("heading", { name: "Project overview" })).toBeVisible();
    await tabs.getByRole("tab", { name: "Plan", exact: true }).click();
    await page.getByLabel("Task name").fill("Keep this draft edit");
    await tabs.getByRole("tab", { name: /Tasks/ }).click();
    await expect(page.getByRole("heading", { name: "Project overview" })).not.toBeVisible();
    await expect(page.getByText("Test signup and capture mobile evidence")).toBeVisible();
    const filters = page.getByRole("group", { name: "Task status filter" });
    await filters.getByRole("button", { name: /Approved/ }).click();
    await expect(page.getByText("Publish the landing page")).toBeVisible();
    await expect(page.getByText("Test signup and capture mobile evidence")).not.toBeVisible();
    await tabs.getByRole("tab", { name: "Plan", exact: true }).click();
    await expect(page.getByLabel("Task name")).toHaveValue("Keep this draft edit");
    await tabs.getByRole("tab", { name: "Plan", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.getByRole("tab", { name: /Tasks/ })).toHaveAttribute("aria-selected", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
