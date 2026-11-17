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

export const paletteSchema = v.fallback(v.picklist(["goat", "arctic", "peach"]), "goat");
export type Palette = v.InferOutput<typeof paletteSchema>;
export const paletteLabels: Record<Palette, { label: string; icon: string }> = {
  goat: { label: "Goat", icon: "pets" },
  arctic: { label: "Arctic", icon: "ac_unit" },
  peach: { label: "Peach", icon: "nutrition" },
};

export const hapticsSchema = v.fallback(v.picklist(["on", "off"]), "on");
export type Haptics = v.InferOutput<typeof hapticsSchema>;

export const syntaxSchema = v.fallback(
  v.picklist([
    "dracula-pro",
    "blade",
    "buffy",
    "lincoln",
    "morbius",
    "van-helsing",
    "nosferatu",
    "alucard",
  ]),
  "dracula-pro",
);
export type Syntax = v.InferOutput<typeof syntaxSchema>;
export const syntaxLabels: Record<Syntax, string> = {
  "dracula-pro": "Dracula Pro",
  blade: "Blade",
  buffy: "Buffy",
  lincoln: "Lincoln",
  morbius: "Morbius",
  "van-helsing": "Van Helsing",
  nosferatu: "Nosferatu",
  alucard: "Alucard",
};

export const matchLightSchema = v.fallback(v.picklist(["on", "off"]), "on");
export type MatchLight = v.InferOutput<typeof matchLightSchema>;
