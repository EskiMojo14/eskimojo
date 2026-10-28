import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { ProjectCard } from "#/routes/projects/-components/project-card";
import { projectKindLabels } from "#/routes/projects/-constants";
import { projectKindSchema } from "#/routes/projects/-schema";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";
import { MdSymbol } from "#/shared/components/symbol";
import { generatePageMetadata } from "#/shared/lib/document-head";

import { projectsByKind } from "./-data";
import Intro from "./-intro.mdx";

import styles from "./index.css?url";

export const Route = createFileRoute("/projects/")({
  staticData: { title: "Projects" },
  validateSearch: v.object({
    type: v.optional(projectKindSchema),
  }),
  head: () => {
    const metadata = generatePageMetadata({
      title: "Projects",
      description:
        "Explore eskimojo's projects, TypeScript utilities, and open-source contributions.",
    });
    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: styles }],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { type: selectedKind } = Route.useSearch();

  return (
    <main className="projects-page" aria-label="Projects">
      <div className="projects-intro">
        <Intro />
      </div>
      <ChipGroup className="projects-filters" aria-label="Filter projects by type">
        {projectKindSchema.options.map((kind) => (
          <InternalLinkChip
            key={kind}
            from="/projects/"
            to="."
            search={(previous) => ({
              ...previous,
              type: previous.type === kind ? undefined : kind,
            })}
            aria-current={selectedKind === kind ? "true" : undefined}
            viewTransition={{ types: ["project-filter"] }}
            replace
            icon={<MdSymbol>{projectKindLabels[kind].icon}</MdSymbol>}
          >
            {projectKindLabels[kind].label}
          </InternalLinkChip>
        ))}
      </ChipGroup>
      {projectKindSchema.options.map((kind) => {
        const entries = projectsByKind[kind];
        const title = projectKindLabels[kind].label;
        if (!entries?.length || (selectedKind !== undefined && selectedKind !== kind)) return null;

        return (
          <section className="projects-section" key={kind} aria-label={title}>
            {selectedKind === undefined && <h2 className="projects-section__title">{title}</h2>}
            <ul className="projects-grid">
              {entries.map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
