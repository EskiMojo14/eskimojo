import type { Project } from "content-collections";

import * as copy from "#/routes/projects/-copy";
import { ExternalLinkButton } from "#/shared/components/buttons/link-button";

export function ProjectLinks({ project }: { project: Project }) {
  return (
    <ul
      className="project-links"
      aria-label={copy.links.label(project)}
      style={{ "--project-header-name": `project-links-${project.slug}` }}
    >
      {project.links.map(({ label, href }) => (
        <li key={href}>
          <ExternalLinkButton href={href} variant="text" size="extra-small">
            {label}
          </ExternalLinkButton>
        </li>
      ))}
    </ul>
  );
}
