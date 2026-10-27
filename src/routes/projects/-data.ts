import { notFound } from "@tanstack/react-router";
import { allProjects } from "content-collections";

export const projects = allProjects.toSorted(
  (a, b) => a.order - b.order || a.title.localeCompare(b.title),
);

export function getProject(slug: string) {
  const project = projects.find((entry) => entry.slug === slug);
  if (!project) throw notFound();
  return project;
}
