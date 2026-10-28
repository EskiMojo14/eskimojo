import * as v from "valibot";

export const projectKindSchema = v.picklist(["project", "package", "contribution"]);
export type ProjectKind = v.InferOutput<typeof projectKindSchema>;

export const projectKindLabels: Record<ProjectKind, { label: string; icon: string }> = {
  project: { label: "Projects", icon: "rocket_launch" },
  package: { label: "Packages", icon: "package_2" },
  contribution: { label: "Open-source contributions", icon: "handshake" },
};
