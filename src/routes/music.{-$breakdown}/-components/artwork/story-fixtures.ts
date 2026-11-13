import type { ArtworkPalette } from "#/routes/music.{-$breakdown}/-query.ts";
import { getProject } from "#/routes/projects/-data";

export function fixturePalette(slug: string): ArtworkPalette {
  const project = getProject(slug);
  if (!project.palette) throw new Error(`Missing palette fixture for ${slug}`);
  const palette: ArtworkPalette = {};
  for (const level of ["standard", "medium", "high"]) {
    for (const role of [
      "surface",
      "on-surface",
      "on-surface-variant",
      "primary",
      "secondary",
      "tertiary",
    ]) {
      const color =
        project.palette[
          `--project-${level}-${role === "surface" ? "surface-container-highest" : role}`
        ];
      if (!color) throw new Error(`Missing fixture color ${level}/${role}`);
      palette[`--artwork-${level}-${role}`] = color;
    }
  }
  return palette;
}
