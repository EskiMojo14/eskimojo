import * as v from "valibot";

export const themeSchema = v.fallback(v.picklist(["system", "light", "dark"]), "system");
export type Theme = v.InferOutput<typeof themeSchema>;
export const themeLabels: Record<Theme, { label: string; icon: string }> = {
  light: { label: "Light", icon: "light_mode" },
  dark: { label: "Dark", icon: "dark_mode" },
  system: { label: "System", icon: "routine" },
};

export const contrastSchema = v.fallback(
  v.picklist(["system", "standard", "medium", "high"]),
  "system",
);
export type Contrast = v.InferOutput<typeof contrastSchema>;
export const contrastLabels: Record<Contrast, { label: string; icon: string }> = {
  standard: { label: "Standard", icon: "contrast" },
  medium: { label: "Medium", icon: "contrast_circle" },
  high: { label: "High", icon: "contrast_square" },
  system: { label: "System", icon: "brightness_auto" },
};

export const paletteSchema = v.fallback(v.picklist(["goat", "arctic"]), "goat");
export type Palette = v.InferOutput<typeof paletteSchema>;
export const paletteLabels: Record<Palette, { label: string; icon: string }> = {
  goat: { label: "Goat", icon: "pets" },
  arctic: { label: "Arctic", icon: "ac_unit" },
};
