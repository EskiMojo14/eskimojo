import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

export const Route = createFileRoute("/")({
  staticData: { title: "Home" },
  head: () =>
    generatePageMetadata({
      title: "Home",
      description:
        "Welcome to eskimojo's personal website. Explore projects, music, and live gigs.",
    }),
  component: Home,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function Home() {
  return null;
}
