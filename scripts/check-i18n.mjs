import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(root, "src/lib/i18n.ts"), "utf8");

function blockFor(language) {
  const start = source.indexOf(`  ${language}: {`);
  if (start === -1) throw new Error(`Missing ${language} dictionary.`);
  const nextLanguage = language === "en" ? source.indexOf("  lt: {", start) : source.indexOf("\n  },\n} as const", start);
  if (nextLanguage === -1) throw new Error(`Could not find end of ${language} dictionary.`);
  return source.slice(start, nextLanguage);
}

function keysFor(language) {
  return [...blockFor(language).matchAll(/^\s+"([^"]+)":/gm)].map((match) => match[1]).sort();
}

const en = keysFor("en");
const lt = keysFor("lt");
const enSet = new Set(en);
const ltSet = new Set(lt);
const missingInLt = en.filter((key) => !ltSet.has(key));
const missingInEn = lt.filter((key) => !enSet.has(key));

if (missingInLt.length || missingInEn.length) {
  if (missingInLt.length) console.error(`Missing in lt:\n${missingInLt.map((key) => `  - ${key}`).join("\n")}`);
  if (missingInEn.length) console.error(`Missing in en:\n${missingInEn.map((key) => `  - ${key}`).join("\n")}`);
  process.exit(1);
}

console.log(`i18n dictionaries match (${en.length} keys).`);
