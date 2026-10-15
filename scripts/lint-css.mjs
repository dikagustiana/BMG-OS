#!/usr/bin/env node
// pnpm lint:css — design system guard (PRD v2 §8, CLAUDE.md): no raw colour outside :root, font sizes only from the
// scale (12/13/14/18/28 px or var(--f1..f5)), padding/margin/gap only from 0, 1px borders aside, the spacing scale.
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "apps/web/app/globals.css";
const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const root = /:root\s*\{[\s\S]*?\n\}/.exec(css);
const outside = root ? css.slice(0, root.index) + " ".repeat(root[0].length) + css.slice(root.index + root[0].length) : css;
const errors = [];
const lineOf = (i) => outside.slice(0, i).split("\n").length;
for (const m of outside.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g)) errors.push(`${file}:${lineOf(m.index)} raw colour ${m[0]} outside :root`);
const FONT = new Set(["12px", "13px", "14px", "18px", "28px"]);
for (const m of outside.matchAll(/font-size:\s*([^;}]+)/g)) {
  const v = m[1].trim();
  if (!v.startsWith("var(--f") && !FONT.has(v) && v !== "inherit") errors.push(`${file}:${lineOf(m.index)} font-size ${v} outside the scale`);
}
const SPACE = new Set(["0", "4px", "8px", "12px", "16px", "24px", "32px", "auto"]);
for (const m of outside.matchAll(/\b(padding|margin|gap)(-[a-z]+)?:\s*([^;}]+)/g)) {
  for (const part of m[3].trim().split(/\s+/)) {
    if (part.startsWith("var(--s") || part.startsWith("calc(") || SPACE.has(part) || /^(\d+(vh|vw|mm|%)|-1px)$/.test(part)) continue; // viewport/print units, sr-only
    errors.push(`${file}:${lineOf(m.index)} ${m[1]}${m[2] ?? ""} ${part} outside the spacing scale`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`lint:css ${file}: OK`);
