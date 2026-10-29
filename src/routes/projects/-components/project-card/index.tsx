import { Link } from "@tanstack/react-router";
import type { Project } from "content-collections";

import { ProjectLinks } from "#/routes/projects/-components/project-links";
import { Card } from "#/shared/components/card";
import { MdSymbol } from "#/shared/components/symbol";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card
      className="project-card"
      style={{ "--project-card-name": `project-card-${project.slug}` }}
    >
      <div className="project-card__heading">
        {project.logo &&
          (typeof project.logo.symbol === "string" ? (
            <span className="project-card__logo" aria-hidden="true">
              <MdSymbol size={40}>{project.logo.symbol}</MdSymbol>
            </span>
          ) : (
            <span className="project-card__logo" data-themed={project.logo.dark ? "" : undefined}>
              <img src={project.logo.light} alt="" width={40} height={40} />
              {project.logo.dark && <img src={project.logo.dark} alt="" width={40} height={40} />}
            </span>
          ))}
        <h3
          className="project-title"
          style={{ "--project-header-name": `project-${project.slug}` }}
        >
          <Link to="/projects/$slug" params={{ slug: project.slug }}>
            {project.title}
          </Link>
        </h3>
      </div>
      <p
        className="project-summary"
        style={{ "--project-header-name": `project-summary-${project.slug}` }}
      >
        {project.summary}
      </p>
      <ProjectLinks project={project} />
    </Card>
  );
}
