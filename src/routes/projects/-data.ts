import { notFound } from "@tanstack/react-router";
import { allProjects } from "content-collections";

import type { ProjectKind } from "#/routes/projects/-constants";

export const projects = allProjects.toSorted(
  (a, b) => a.order - b.order || a.title.localeCompare(b.title),
);

export const projectsByKind: Partial<Record<ProjectKind, typeof projects>> = Object.groupBy(
  projects,
  (project) => project.kind,
);

export function getProject(slug: string) {
  const project = projects.find((entry) => entry.slug === slug);
  if (!project) throw notFound();
  return project;
}
