import { resolve } from "node:path";

import { hexFromArgb } from "@material/material-color-utilities";

import {
  imageSourceColor,
  imageColorScheme,
  readableImageColor as readable,
} from "#/shared/lib/image-palette";

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
