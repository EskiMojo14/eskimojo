import { createFileRoute } from "@tanstack/react-router";

import { ProjectCard } from "#/routes/projects/-components/project-card";
import { generatePageMetadata } from "#/shared/lib/document-head";

import { projectGroupTitles, projectsByKind } from "./-data";
import Intro from "./-intro.mdx";

import styles from "./index.css?url";

export const Route = createFileRoute("/projects/")({
  staticData: { title: "Projects" },
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
  return (
    <main className="projects-page" aria-label="Projects">
      <div className="projects-intro">
        <Intro />
      </div>
      {Object.entries(projectGroupTitles).map(([kind, title]) => {
        const entries = projectsByKind[kind];
        if (!entries?.length) return null;

        return (
          <section className="projects-section" key={kind} aria-labelledby={`projects-${kind}`}>
            <h2 className="projects-section__title" id={`projects-${kind}`}>
              {title}
            </h2>
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
