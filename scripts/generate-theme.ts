/**
 * Generates palettes from the six Material Theme Builder CSS exports per theme in
 * src/shared/styles/theme/exports/<name>/:
 *
 * - src/shared/styles/theme/palettes/<name>.gen.css: one %placeholder per contrast level, with
 *   each token's light and dark values combined via light-dark().
 * - .storybook/palette.gen.ts: goat's standard-contrast roles as literal hex values for
 *   Storybook's own UI, plus an accent for its colorSecondary that meets WCAG AA.
 *
 * The exports only contain the scheme's own roles, so extended colours (Material palette
 * hues the scheme lacks, e.g. green) are generated here: each is harmonised towards the
 * scheme's primary, then given primary-style roles by a tonal-spot scheme at each
 * contrast level, the same way the Theme Builder derives the exported roles.
 */
import { mkdirSync, readdirSync, readFileSync } from "node:fs";

import {
  argbFromHex,
  Blend,
  Hct,
  MaterialDynamicColors,
  SchemeTonalSpot,
  TonalPalette,
} from "@material/material-color-utilities";

import { writeFormatted } from "./write-formatted.ts";

type Rgb = [number, number, number];
type Scheme = "light" | "dark";

const themeDir = new URL("../src/shared/styles/theme/", import.meta.url);
const levels = {
  standard: { suffix: "", contrast: 0 },
  medium: { suffix: "-mc", contrast: 0.5 },
  high: { suffix: "-hc", contrast: 1 },
} as const;

/** Material 2 palette 500s; only their hue and chroma are used. */
const extendedColors = {
  green: "#4caf50",
  yellow: "#ffeb3b",
  teal: "#009688",
} as const;

function readTokens(theme: string, file: string): Map<string, string> {
  const path = `exports/${theme}/${file}.css`;
  const css = readFileSync(new URL(path, themeDir), "utf8");
  const tokens = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--md-sys-color-([\w-]+)\s*:\s*([^;]+);/g)) {
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
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const toRgb = (argb: number) => `rgb(${(argb >> 16) & 255} ${(argb >> 8) & 255} ${argb & 255})`;

function addExtendedColors(roles: Map<string, [string, string]>, contrastLevel: number) {
  const primary = roles.get("primary");
  if (!primary) throw new Error("The export has no primary role");
  const source = argbFromHex(hex(parseRgb(primary[0])));
  const materialColors = new MaterialDynamicColors();
  for (const [name, value] of Object.entries(extendedColors)) {
    const hct = Hct.fromInt(Blend.harmonize(argbFromHex(value), source));
    const [light, dark] = [false, true].map(
      (isDark) => new SchemeTonalSpot(hct, isDark, contrastLevel),
    );
    const colors = {
      [name]: materialColors.primary(),
      [`on-${name}`]: materialColors.onPrimary(),
      [`${name}-container`]: materialColors.primaryContainer(),
      [`on-${name}-container`]: materialColors.onPrimaryContainer(),
    };
    for (const [role, color] of Object.entries(colors)) {
      roles.set(role, [toRgb(color.getArgb(light)), toRgb(color.getArgb(dark))]);
    }
  }
  return roles;
}

const themes = readdirSync(new URL("exports/", themeDir), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
if (themes.length === 0) throw new Error("No themes found in src/shared/styles/theme/exports/");

const themePalettes = Object.fromEntries(
  themes.map((theme) => [
    theme,
    Object.fromEntries(
      Object.entries(levels).map(([level, { suffix, contrast: contrastLevel }]) => [
        level,
        addExtendedColors(readLevel(theme, suffix), contrastLevel),
      ]),
    ),
  ]),
);
const palettes = themePalettes.goat;
if (!palettes) throw new Error("The goat theme is required for Storybook's palette");

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
for (const [name, [l, d]] of palettes.standard) {
  const key = name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
  roles.light[key] = parseRgb(l);
  roles.dark[key] = parseRgb(d);
}

const fromArgb = (argb: number): Rgb => [(argb >> 16) & 255, (argb >> 8) & 255, argb & 255];

function luminance(c: Rgb) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Matches polished's darken(), which Storybook applies in dark mode: lower HSL lightness.
function darken(c: Rgb, amount: number): Rgb {
  const [r, g, b] = c.map((v) => v / 255);
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
  const surfaces = [c.surface, c.surfaceContainer];
  const passes = (accent: Rgb) => {
    const selectedBg = scheme === "dark" ? darken(accent, 0.18) : accent;
    return (
      contrast(white, selectedBg) >= minContrast &&
      surfaces.every((surface) => contrast(accent, surface) >= minContrast)
    );
  };
  if (passes(c.primary)) return c.primary;

  const primary = argbFromHex(hex(c.primary));
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
