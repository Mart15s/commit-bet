import { describe, expect, it } from "vitest";
import { uiTranslations } from "@/lib/ui-translations";
import { getDictionary, translate } from "@/lib/i18n";
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
    for (const background of ["#0B1220", "#111C2E", "#19283C"])
      for (const foreground of [
        "#F8FAFC",
        "#9FB0C3",
        "#2DD4BF",
        "#60A5FA",
        "#34D399",
        "#FBBF24",
        "#FB7185",
        "#7DD3FC",
      ])
        expect(
          contrast(background, foreground),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
    for (const background of ["#2DD4BF", "#14B8A6"])
      expect(contrast("#0B1220", background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#60738A", "#111C2E")).toBeGreaterThanOrEqual(3);
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
