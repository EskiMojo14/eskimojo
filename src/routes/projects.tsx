import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

export const Route = createFileRoute("/projects")({
  staticData: { title: "Projects" },
  head: () =>
    generatePageMetadata({
      title: "Projects",
      description:
        "Explore eskimojo's projects, TypeScript utilities, and open-source contributions.",
    }),
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  return null;
}
