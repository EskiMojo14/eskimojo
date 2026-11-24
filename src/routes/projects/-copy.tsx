import type { Project } from "content-collections";

import type { ProjectKind } from "#/routes/projects/-schema";

export const meta = {
  title: "Projects",
  description: "Things I've made",
} as const;

export const detailsMeta = {
  backLinkLabel: "Back to projects",
  logoAlt: (title: string) => `${title} logo`,
} as const;

export const filters = {
  title: "Filter projects by type",
  kind: {
    project: { label: "Projects", icon: "build" },
    package: { label: "Packages", icon: "package_2" },
    contribution: { label: "Open-source contributions", icon: "handshake" },
  } as const satisfies Record<ProjectKind, { label: string; icon: string }>,
} as const;

export const links = {
  label: ({ title }: Project) => `${title} links`,
} as const;
