import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navLinks } from "@/components/app-nav";
import { dictionaries } from "@/lib/i18n";
import { daysRemaining, projectDisplayStatus, projectSuccessScore } from "@/lib/projects";

describe("projects navigation and i18n", () => {
  it("adds Projects to the navbar in the expected order", () => {
    expect(navLinks.map((link) => link.labelKey)).toEqual([
      "nav.home",
      "nav.projects",
      "nav.team",
      "nav.create",
      "nav.review",
      "nav.log",
      "nav.profile",
    ]);
    expect(navLinks[1].href).toBe("/projects");
  });

  it("keeps new UI translation keys in English and Lithuanian", () => {
    const keys = [
      "nav.projects",
      "projects.title",
      "projects.filter.all",
      "projects.filter.draft",
      "projects.filter.active",
      "projects.filter.completed",
      "projects.emptyTitle",
      "projects.create",
      "projects.open",
      "ai.unavailableTitle",
      "ai.retry",
      "ai.continueManually",
      "ai.fallbackDraft",
    ];

    for (const key of keys) {
      expect(dictionaries.en).toHaveProperty(key);
      expect(dictionaries.lt).toHaveProperty(key);
    }
  });

  it("calculates project card status and score", () => {
    expect(projectDisplayStatus("active", [{ status: "approved" }, { status: "disputed" }])).toBe("disputed");
    expect(projectSuccessScore([{ status: "approved" }, { status: "submitted" }, { status: "todo" }])).toBe(37);
    expect(daysRemaining("2026-07-03", new Date("2026-07-01T00:00:00Z"))).toBe(2);
  });

  it("includes project cards and empty state on the Projects route", () => {
    const source = readFileSync("src/app/(protected)/app/projects/page.tsx", "utf8");
    expect(source).toContain("projects.emptyTitle");
    expect(source).toContain("/app/projects/${project.id}");
    expect(source).toContain("project_member_profiles");
  });
});
