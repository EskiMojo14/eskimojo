import type { ProjectKind } from "#/routes/projects/-schema";

export const projectKindLabels: Record<ProjectKind, { label: string; icon: string }> = {
  project: { label: "Projects", icon: "build" },
  package: { label: "Packages", icon: "package_2" },
  contribution: { label: "Open-source contributions", icon: "handshake" },
};
