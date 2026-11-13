import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  argbFromRgb,
  Contrast,
  Hct,
  hexFromArgb,
  QuantizerMap,
  SchemeMonochrome,
  SchemeTonalSpot,
  Score,
} from "@material/material-color-utilities";
import sharp from "sharp";

function readSyntaxColors() {
  const css = readFileSync(resolve("src/shared/styles/syntax.gen.css"), "utf8");
  const standard = /%syntax-standard\s*\{([^}]+)\}/.exec(css)?.[1];
  if (!standard) throw new Error("Missing standard syntax palette in syntax.gen.css");
  const colors = new Map<string, [number, number]>();
  for (const [, role, r, g, b, dr, dg, db] of standard.matchAll(
    /--syntax-([\w-]+):\s*light-dark\(rgb\((\d+) (\d+) (\d+)\), rgb\((\d+) (\d+) (\d+)\)\)/g,
  )) {
    if (!role) throw new Error("Missing syntax color role");
    colors.set(role, [
      argbFromRgb(Number(r), Number(g), Number(b)),
      argbFromRgb(Number(dr), Number(dg), Number(db)),
    ]);
  }
  for (const role of ["keyword", "string", "function", "number", "type", "parameter"]) {
    if (!colors.has(role)) throw new Error(`Missing syntax color ${role}`);
  }
  return colors;
}

const syntaxColors = readSyntaxColors();

async function sourceColor(src: string) {
  const bytes = await sharp(resolve("public", src.slice(1)))
    .resize(128, 128, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer();
  const pixels: Array<number> = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    const a = bytes[i + 3];
    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined && a >= 128) {
      pixels.push(argbFromRgb(r, g, b));
    }
  }
  if (pixels.length === 0) throw new Error(`No visible logo pixels in ${src}`);

  // A bounded color histogram avoids Celebi's randomized clustering between builds.
  const colors = QuantizerMap.quantize(pixels);
  const dominant = [...colors].toSorted((a, b) => b[1] - a[1])[0]?.[0];
  if (dominant === undefined) throw new Error(`No logo colors extracted from ${src}`);
  // Grayscale logos should remain neutral rather than using Score's Google Blue fallback.
  const seed = Score.score(colors, { desired: 1, fallbackColorARGB: dominant })[0];
  if (seed === undefined) throw new Error(`No source color selected for ${src}`);
  return Hct.fromInt(seed);
}

function readable(color: number, background: number, target: number, isDark: boolean) {
  const original = Hct.fromInt(color);
  const backgroundTone = Hct.fromInt(background).tone;
  let candidate = color;
  for (let tone = original.tone; tone >= 0 && tone <= 100; tone += isDark ? 0.1 : -0.1) {
    candidate = Hct.from(original.hue, original.chroma, tone).toInt();
    if (Contrast.ratioOfTones(Hct.fromInt(candidate).tone, backgroundTone) >= target) {
      return hexFromArgb(candidate);
    }
  }
  throw new Error(`Cannot meet ${target}:1 for project card foreground`);
}

export async function generateProjectPalette(logo: { light: string; dark?: string }) {
  const light = await sourceColor(logo.light);
  const dark = logo.dark && logo.dark !== logo.light ? await sourceColor(logo.dark) : light;
  const palette: Record<`--project-${string}`, string> = {};
  for (const [level, contrast, target] of [
    ["standard", 0, 4.5],
    ["medium", 0.5, 6],
    ["high", 1, 7],
  ] as const) {
    const schemes = [light, dark].map((source, index) =>
      source.chroma < 5
        ? new SchemeMonochrome(source, index === 1, contrast)
        : new SchemeTonalSpot(source, index === 1, contrast),
    );
    const values = schemes.map((scheme): Record<string, string> => {
      const background = scheme.surfaceContainerHighest;
      const colors: Record<string, string> = {
        surface: hexFromArgb(scheme.surface),
        "surface-container-low": hexFromArgb(scheme.surfaceContainerLow),
        "surface-container-high": hexFromArgb(scheme.surfaceContainerHigh),
        "surface-container-highest": hexFromArgb(background),
        outline: hexFromArgb(scheme.outline),
        "outline-variant": hexFromArgb(scheme.outlineVariant),
        "on-surface": readable(scheme.onSurface, background, target, scheme.isDark),
        "on-surface-variant": readable(scheme.onSurfaceVariant, background, target, scheme.isDark),
        primary: readable(scheme.primary, background, target, scheme.isDark),
        secondary: readable(scheme.secondary, background, target, scheme.isDark),
        tertiary: readable(scheme.tertiary, background, target, scheme.isDark),
        error: readable(scheme.error, background, target, scheme.isDark),
      };
      for (const [role, [lightColor, darkColor]] of syntaxColors) {
        colors[`syntax-${role}`] = readable(
          scheme.isDark ? darkColor : lightColor,
          scheme.surfaceContainerLow,
          target,
          scheme.isDark,
        );
      }
      return colors;
    });
    const [l, d] = values;
    if (!l || !d) throw new Error(`Missing ${level} project card scheme`);
    for (const [role, lightColor] of Object.entries(l)) {
      const darkColor = d[role];
      if (!darkColor) throw new Error(`Missing ${level}/${role} dark card color`);
      palette[`--project-${level}-${role}`] = `light-dark(${lightColor}, ${darkColor})`;
    }
  }
  return palette;
}
