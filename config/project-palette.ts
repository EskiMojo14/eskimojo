import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { argbFromRgb, hexFromArgb } from "@material/material-color-utilities";

import {
  imageSourceColor,
  imageColorScheme,
  readableImageColor as readable,
} from "#/shared/lib/image-palette";

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

export async function generateProjectPalette(logo: { light: string; dark?: string }) {
  const light = await imageSourceColor(resolve("public", logo.light.slice(1)));
  const dark =
    logo.dark && logo.dark !== logo.light
      ? await imageSourceColor(resolve("public", logo.dark.slice(1)))
      : light;
  const palette: Record<`--project-${string}`, string> = {};
  for (const [level, contrast, target] of [
    ["standard", 0, 4.5],
    ["medium", 0.5, 6],
    ["high", 1, 7],
  ] as const) {
    const schemes = [light, dark].map((source, index) =>
      imageColorScheme(source, index === 1, contrast),
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
