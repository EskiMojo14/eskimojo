import { Link } from "@tanstack/react-router";
import type { Project } from "content-collections";

import { ProjectLinks } from "#/routes/projects/-components/project-links";
import { Card } from "#/shared/components/card";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="project-card">
      <h2 className="project-title" style={{ viewTransitionName: `project-${project.slug}` }}>
        <Link
          to="/projects/$slug"
          params={{ slug: project.slug }}
          viewTransition={{ types: ["project"] }}
        >
          {project.title}
        </Link>
      </h2>
      <p className="project-summary">{project.summary}</p>
      <ProjectLinks project={project} />
    </Card>
  );
}
