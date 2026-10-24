import { describe, expect, it } from "vitest";
import { uiTranslations } from "@/lib/ui-translations";
import { getDictionary, translate } from "@/lib/i18n";
import { readFileSync } from "node:fs";
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
describe("UI accessibility and localization", () => {
  it("has matching English and Lithuanian keys for this iteration", () => {
    expect(Object.keys(uiTranslations.en).sort()).toEqual(
      Object.keys(uiTranslations.lt).sort(),
    );
  });
  it("uses readable AA palette pairs", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const color = (name: string) => {
      const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
      if (!value) throw new Error(`Missing brand token ${name}`);
      return value;
    };
    expect(color("obsidian-void").toUpperCase()).toBe("#0B0F14");
    expect(color("laser-mint").toUpperCase()).toBe("#00F59B");
    expect(color("blaze-amber").toUpperCase()).toBe("#FF8A00");
    expect(color("slate-steel").toUpperCase()).toBe("#1E293B");
    expect(color("muted-titanium").toUpperCase()).toBe("#94A3B8");
    expect(color("pure-glare").toUpperCase()).toBe("#F8FAFC");
    expect(color("sovereign-gold").toUpperCase()).toBe("#FFD700");
    for (const background of [color("obsidian-void"), color("slate-steel")])
      for (const foreground of [
        color("pure-glare"), color("muted-titanium"), color("laser-mint"), color("blaze-amber"),
      ])
        expect(
          contrast(background, foreground),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color("obsidian-void"), color("pure-glare"))).toBeGreaterThanOrEqual(4.5);
  });
  it("localizes review states instead of displaying raw database status", () => {
    expect(translate("lt", "status.needs_changes")).toBe("Prašoma pakeitimų");
    expect(translate("lt", "status.submitted")).toBe("Laukia peržiūros");
  });
  it("keeps user-authored content unchanged and gives all UI keys an LT translation", () => {
    expect(translate("lt", "A user’s unique project title")).toBe(
      "A user’s unique project title",
    );
    const lt = getDictionary("lt");
    for (const key of Object.keys(uiTranslations.en))
      expect(lt).toHaveProperty(key);
  });
});
