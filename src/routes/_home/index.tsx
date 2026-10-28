import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

import { HomeHero } from "./-components/home-hero";

import styles from "./index.css?url";

export const Route = createFileRoute("/_home/")({
  staticData: { title: "Home" },
  head: () => {
    const metadata = generatePageMetadata({
      title: "Home",
      description:
        "Welcome to eskimojo's personal website. Explore projects, music, and live gigs.",
    });
    return {
      ...metadata,
      links: [
        ...metadata.links,
        { rel: "stylesheet", href: styles },
        {
          rel: "preload",
          href: "/Mitzi-hero.webp",
          as: "image",
          fetchPriority: "high" as const,
        },
      ],
    };
  },
  component: Home,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function Home() {
  return <HomeHero />;
}
