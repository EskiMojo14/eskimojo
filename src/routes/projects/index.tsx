import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { ProjectCard } from "#/routes/projects/-components/project-card";
import { projectKindSchema } from "#/routes/projects/-schema";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";
import { MdSymbol } from "#/shared/components/symbol";
import { generatePageMetadata } from "#/shared/lib/document-head";

import * as copy from "./-copy";
import { projectsByKind } from "./-data";
import Intro from "./-intro.mdx";

import styles from "./index.css?url";

export const Route = createFileRoute("/projects/")({
  staticData: { title: copy.meta.title },
  validateSearch: v.object({
    type: v.optional(projectKindSchema),
  }),
  head: () => {
    const metadata = generatePageMetadata(copy.meta);

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
    <main className="projects-page" aria-label={copy.meta.title}>
      <div className="projects-intro">
        <Intro />
      </div>
      <ChipGroup className="projects-filters" aria-label={copy.filters.title}>
        {projectKindSchema.options.map((kind) => (
          <InternalLinkChip
            key={kind}
            from="/projects/"
            to="."
            search={(previous) => ({
              ...previous,
              type: previous.type === kind ? undefined : kind,
            })}
            replace
            icon={<MdSymbol>{copy.filters.kind[kind].icon}</MdSymbol>}
          >
            {copy.filters.kind[kind].label}
          </InternalLinkChip>
        ))}
      </ChipGroup>
      {projectKindSchema.options.map((kind) => {
        const entries = projectsByKind[kind];
        const { label } = copy.filters.kind[kind];

        if (!entries?.length || (selectedKind !== undefined && selectedKind !== kind)) return null;

        return (
          <section className="projects-section" key={kind} aria-label={label}>
            {selectedKind === undefined && <h2 className="projects-section__title">{label}</h2>}
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
