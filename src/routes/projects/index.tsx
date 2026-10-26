import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

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
    <>
      <div className="projects-intro">
        <Intro />
      </div>
    </>
  );
}
