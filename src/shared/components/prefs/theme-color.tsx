import { themeColors } from "#/shared/styles/theme/theme-colors.gen";
import { code } from "#/utils";

import { useContrast, usePalette, useTheme } from "./context";

export function ThemeColor() {
  const { theme } = useTheme();
  const { contrast } = useContrast();
  const { palette } = usePalette();
  const schemes = theme === "system" ? (["light", "dark"] as const) : [theme];
  const contrasts = contrast === "system" ? (["standard", "high"] as const) : [contrast];

  return schemes.flatMap((scheme) =>
    contrasts.map((level) => {
      const conditions = [
        theme === "system" ? code.css`(prefers-color-scheme: ${scheme})` : undefined,
        contrast === "system"
          ? level === "high"
            ? code.css`(prefers-contrast: more)`
            : code.css`(not (prefers-contrast: more))`
          : undefined,
      ].filter((condition) => condition !== undefined);

      return (
        <meta
          key={`${scheme}-${level}`}
          name="theme-color"
          content={themeColors[palette][level][scheme]}
          media={conditions.length ? conditions.join(" and ") : undefined}
        />
      );
    }),
  );
}
