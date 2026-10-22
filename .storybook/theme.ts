import { create, getPreferredColorScheme } from "storybook/theming";

import { palette } from "./palette.gen";

const font = '"Paper Mono", monospace';
const scheme = getPreferredColorScheme();
// Storybook derives tints from these values, so they must be literal colors rather
// than CSS variables. scripts/generate-theme.ts generates palette.gen.ts from the export.
const c = palette[scheme];

export const theme = create({
  base: scheme,

  colorPrimary: c.primary,
  // Links on the surface and the background of white selected-item text. The
  // generator picks the primary-palette tone closest to primary that meets 4.5:1.
  colorSecondary: c.accent,

  appBg: c.surfaceContainer,
  appContentBg: c.surface,
  appPreviewBg: c.surface,
  appHoverBg: c.surfaceContainerHigh,
  appBorderColor: c.outlineVariant,
  appBorderRadius: 12,

  fontBase: font,
  fontCode: font,

  textColor: c.onSurface,
  textInverseColor: c.onPrimary,
  textMutedColor: c.onSurfaceVariant,

  barBg: c.surfaceContainerLow,
  barTextColor: c.onSurfaceVariant,
  barHoverColor: c.primary,
  barSelectedColor: c.primary,

  buttonBg: c.surfaceContainerHigh,
  buttonBorder: c.outlineVariant,
  booleanBg: c.surfaceContainerHigh,
  booleanSelectedBg: c.surfaceContainerLowest,

  inputBg: c.surfaceContainerLowest,
  inputBorder: c.outline,
  inputTextColor: c.onSurface,
  inputBorderRadius: 8,

  brandTitle: "eskimojo",
});
