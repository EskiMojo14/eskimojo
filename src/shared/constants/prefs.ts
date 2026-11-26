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

export const hapticsSchema = v.fallback(v.picklist(["on", "off"]), "on");

export type Haptics = v.InferOutput<typeof hapticsSchema>;

export const darkSyntaxOptions = v.picklist([
  "dracula-classic",
  "dracula-pro",
  "blade",
  "buffy",
  "lincoln",
  "morbius",
  "van-helsing",
  "nosferatu",
]);

export const lightSyntaxOptions = v.picklist(["alucard-classic", "alucard", "utarefson"]);
export const lightSyntaxSchema = v.fallback(lightSyntaxOptions, "alucard");
export const darkSyntaxSchema = v.fallback(darkSyntaxOptions, "dracula-pro");

export type LightSyntax = v.InferOutput<typeof lightSyntaxSchema>;

export type DarkSyntax = v.InferOutput<typeof darkSyntaxSchema>;

export const syntaxLabels: Record<
  LightSyntax | DarkSyntax,
  { label: string; color?: string; supporting?: string }
> = {
  "dracula-classic": { label: "Dracula Classic", color: "purple" },
  "dracula-pro": { label: "Dracula Pro", color: "purple" },
  blade: { label: "Blade", color: "green" },
  buffy: { label: "Buffy", color: "pink" },
  lincoln: { label: "Lincoln", color: "yellow" },
  morbius: { label: "Morbius", color: "red" },
  "van-helsing": { label: "Van Helsing", color: "cyan" },
  nosferatu: { label: "Nosferatu", color: "orange", supporting: "High contrast" },
  "alucard-classic": { label: "Alucard Classic" },
  alucard: { label: "Alucard" },
  utarefson: { label: "Utarefson", supporting: "High contrast (unofficial)" },
};

export const densitySchema = v.fallback(v.picklist(["small", "medium", "large"]), "medium");

export type Density = v.InferOutput<typeof densitySchema>;

export const densityLabels: Record<Density, { label: string; icon: string }> = {
  small: { label: "Small", icon: "density_small" },
  medium: { label: "Medium", icon: "density_medium" },
  large: { label: "Large", icon: "density_large" },
};
