/**
 * Generates palettes from the six Material Theme Builder CSS exports per theme in
 * src/shared/styles/theme/exports/<name>/:
 *
 * - src/shared/styles/theme/palettes/<name>.gen.css: one %placeholder per contrast level, with
 *   each token's light and dark values combined via light-dark().
 * - .storybook/palette.gen.ts: goat's standard-contrast roles as literal hex values for
 *   Storybook's own UI, plus an accent for its colorSecondary that meets WCAG AA.
 *
 * Syntax colours combine the two palettes' standard accents, adjusting their
 * light-mode tones only as far as each contrast target requires.
 */
import { mkdirSync, readdirSync, readFileSync } from "node:fs";

import { argbFromHex, Hct, TonalPalette } from "@material/material-color-utilities";

import { assert } from "#/utils/index.ts";

import { writeFormatted } from "./write-formatted.ts";

type Rgb = [number, number, number];
type Scheme = "light" | "dark";

const themeDir = new URL("../src/shared/styles/theme/", import.meta.url);
const levels = {
  standard: { suffix: "" },
  medium: { suffix: "-mc" },
  high: { suffix: "-hc" },
} as const;

function readTokens(theme: string, file: string): Map<string, string> {
  const path = `exports/${theme}/${file}.css`;
  const css = readFileSync(new URL(path, themeDir), "utf8");
  const tokens = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--md-sys-color-([\w-]+)\s*:\s*([^;]+);/g)) {
    assert(name && value, `Malformed --md-sys-color-* token in ${path}`);
    if (!tokens.has(name)) tokens.set(name, value.trim());
  }
  if (tokens.size === 0) throw new Error(`No --md-sys-color-* tokens found in ${path}`);
  return tokens;
}

/** Each role's [light, dark] values, keyed by role name without the prefix. */
function readLevel(theme: string, suffix: string): Map<string, [string, string]> {
  const light = readTokens(theme, `light${suffix}`);
  const dark = readTokens(theme, `dark${suffix}`);
  const roles = new Map<string, [string, string]>();
  for (const name of new Set([...light.keys(), ...dark.keys()])) {
    const l = light.get(name);
    const d = dark.get(name);
    if (!l || !d)
      throw new Error(`${name} is missing from exports/${theme}/light${suffix} or dark${suffix}`);
    roles.set(name, [l, d]);
  }
  return roles;
}

function parseRgb(value: string): Rgb {
  const m = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)$/.exec(value);
  if (!m) throw new Error(`Expected rgb(r g b), got ${value}`);
  const [red, green, blue] = m.slice(1);
  assert(
    red !== undefined && green !== undefined && blue !== undefined,
    `Expected three RGB channels, got ${value}`,
  );
  return [Number(red), Number(green), Number(blue)];
}

const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const fromArgb = (argb: number): Rgb => [(argb >> 16) & 255, (argb >> 8) & 255, argb & 255];

const themes = readdirSync(new URL("exports/", themeDir), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
if (themes.length === 0) throw new Error("No themes found in src/shared/styles/theme/exports/");

const themePalettes: Record<
  string,
  Partial<Record<keyof typeof levels, Map<string, [string, string]>>>
> = Object.fromEntries(
  themes.map((theme) => [
    theme,
    Object.fromEntries(
      Object.entries(levels).map(([level, { suffix }]) => [level, readLevel(theme, suffix)]),
    ),
  ]),
);
const palettes = themePalettes.goat;
if (!palettes) throw new Error("The goat theme is required for Storybook's palette");
const standardPalette = palettes.standard;
assert(standardPalette, "The goat theme is missing its standard palette");

function linearChannel(v: number) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

const syntaxRoles = {
  keyword: ["goat", "primary"],
  string: ["arctic", "tertiary"],
  function: ["arctic", "primary"],
  number: ["goat", "tertiary"],
  type: ["arctic", "primary"],
  parameter: ["goat", "error"],
} as const;
const syntaxLevels = [
  { level: "standard", target: 4.5 },
  { level: "medium", target: 6 },
  { level: "high", target: 7 },
] as const;
const syntaxBlocks = syntaxLevels.map(({ level, target }) => {
  const backgrounds = Object.values(themePalettes).map((palette) => {
    const levelPalette = palette[level];
    assert(levelPalette, `Missing ${level} palette`);
    const background = levelPalette.get("surface-container-low");
    if (!background) throw new Error(`Missing syntax background for ${level}`);
    return parseRgb(background[0]);
  });
  const declarations = Object.entries(syntaxRoles).map(([name, [theme, role]]) => {
    const palette = themePalettes[theme];
    const standard = palette?.standard;
    const colors = standard?.get(role);
    if (!colors) throw new Error(`Missing syntax colour ${theme}/${role}`);
    const original = parseRgb(colors[0]);
    const hct = Hct.fromInt(argbFromHex(hex(original)));
    let light = original;
    for (let tone = hct.tone; backgrounds.some((bg) => contrast(light, bg) < target); tone -= 0.1) {
      if (tone < 0) throw new Error(`Cannot meet ${target}:1 for syntax ${name}`);
      light = fromArgb(Hct.from(hct.hue, hct.chroma, tone).toInt());
    }
    return `  --syntax-${name}: light-dark(rgb(${light.join(" ")}), ${colors[1]});`;
  });
  return `%syntax-${level} {\n${declarations.join("\n")}\n}`;
});
await writeFormatted(
  new URL("../syntax.gen.css", themeDir),
  `/* Generated by scripts/generate-theme.ts from theme/exports — do not edit by hand. */\n\n${syntaxBlocks.join("\n\n")}

:root,
[data-contrast="standard"] {
  @extend %syntax-standard;
}

[data-contrast="medium"] {
  @extend %syntax-medium;
}

[data-contrast="high"] {
  @extend %syntax-high;
}

@media (prefers-contrast: more) {
  :root:is(:not([data-contrast]), [data-contrast="system"]) {
    @extend %syntax-high;
  }
}
`,
);

// palettes/<name>.gen.css

mkdirSync(new URL("palettes/", themeDir), { recursive: true });
for (const [theme, palette] of Object.entries(themePalettes)) {
  const blocks = Object.entries(palette).map(([level, roles]) => {
    const declarations = [...roles].map(
      ([name, [l, d]]) => `  --md-sys-color-${name}: ${l === d ? l : `light-dark(${l}, ${d})`};`,
    );
    return `%${theme}-${level} {\n${declarations.join("\n")}\n}`;
  });

  await writeFormatted(
    new URL(`palettes/${theme}.gen.css`, themeDir),
    `/* Generated by scripts/generate-theme.ts from ../exports/${theme} — do not edit by hand. */\n\n${blocks.join("\n\n")}\n`,
  );
}

// .storybook/palette.gen.ts

const minContrast = 4.5;
const white: Rgb = [255, 255, 255];

const roles: Record<Scheme, Record<string, Rgb>> = { light: {}, dark: {} };
for (const [name, [l, d]] of standardPalette) {
  const key = name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
  roles.light[key] = parseRgb(l);
  roles.dark[key] = parseRgb(d);
}

function luminance(c: Rgb) {
  const [r, g, b] = [linearChannel(c[0]), linearChannel(c[1]), linearChannel(c[2])];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Matches polished's darken(), which Storybook applies in dark mode: lower HSL lightness.
function darken(c: Rgb, amount: number): Rgb {
  const [r, g, b] = [c[0] / 255, c[1] / 255, c[2] / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  const nl = Math.max(0, l - amount);
  const q = nl < 0.5 ? nl * (1 + s) : nl + s - nl * s;
  const p = 2 * nl - q;
  const channel = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (u < 1 / 6) return p + (q - p) * 6 * u;
    if (u < 1 / 2) return q;
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6;
    return p;
  };
  const rgbOut: Rgb = s === 0 ? [nl, nl, nl] : [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
  return [Math.round(rgbOut[0] * 255), Math.round(rgbOut[1] * 255), Math.round(rgbOut[2] * 255)];
}

/**
 * Storybook uses colorSecondary as link text on the surfaces, and as the background of
 * white selected-item text (darkened by 0.18 in dark mode). Use primary if it passes
 * both, otherwise the nearest tone of the primary palette that does.
 */
function accentFor(scheme: Scheme): Rgb {
  const c = roles[scheme];
  const primaryColor = c.primary;
  const surface = c.surface;
  const surfaceContainer = c.surfaceContainer;
  assert(
    primaryColor && surface && surfaceContainer,
    `Missing required ${scheme} Storybook palette roles`,
  );
  const surfaces = [surface, surfaceContainer];
  const passes = (accent: Rgb) => {
    const selectedBg = scheme === "dark" ? darken(accent, 0.18) : accent;
    return (
      contrast(white, selectedBg) >= minContrast &&
      surfaces.every((background) => contrast(accent, background) >= minContrast)
    );
  };
  if (passes(primaryColor)) return primaryColor;

  const primary = argbFromHex(hex(primaryColor));
  const palette = TonalPalette.fromInt(primary);
  const start = Math.round(Hct.fromInt(primary).tone);
  // primary itself failed, so try tones moving away from it: start-1, start+1, start-2, …
  for (let distance = 1; distance <= 100; distance++) {
    for (const tone of [start - distance, start + distance]) {
      if (tone < 0 || tone > 100) continue;
      const candidate = fromArgb(palette.tone(tone));
      if (passes(candidate)) return candidate;
    }
  }
  throw new Error(`No tone of the ${scheme} primary palette meets ${minContrast}:1 for the accent`);
}

const render = (scheme: Scheme) => {
  const entries = Object.entries(roles[scheme]).map(([k, v]) => `    ${k}: "${hex(v)}",`);
  entries.push(`    accent: "${hex(accentFor(scheme))}",`);
  return `  ${scheme}: {\n${entries.join("\n")}\n  },`;
};

await writeFormatted(
  new URL("../.storybook/palette.gen.ts", import.meta.url),
  `// Generated by scripts/generate-theme.ts from src/shared/styles/theme/exports/goat.
// Do not edit by hand: run \`vp run theme:generate\`.

export const palette = {
${render("light")}
${render("dark")}
} as const;
`,
);
