import type { Project } from "content-collections";

import { ExternalLinkButton } from "#/shared/components/buttons/link-button";

export function ProjectLinks({ project }: { project: Project }) {
  return (
    <ul className="project-links" aria-label={`${project.title} links`}>
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
