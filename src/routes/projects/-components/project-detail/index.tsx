import type { Project } from "content-collections";
import type { ReactNode } from "react";

import { ProjectLinks } from "#/routes/projects/-components/project-links";

export function ProjectDetail({ project, children }: { project: Project; children: ReactNode }) {
  return (
    <article className="project-detail">
      <header className="project-detail__header">
        <h1
          className="project-title project-title--detail"
          style={{ viewTransitionName: `project-${project.slug}` }}
        >
          {project.title}
        </h1>
        <p className="project-summary">{project.summary}</p>
        <ProjectLinks project={project} />
      </header>
      <div className="project-detail__body">{children}</div>
    </article>
  );
}
