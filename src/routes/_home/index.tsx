import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

import { HomeHero } from "./-components/home-hero";
import { SocialLink } from "./-components/social-link";
import * as copy from "./-copy";
import Intro from "./-intro.mdx";

import styles from "./index.css?url";

export const Route = createFileRoute("/_home/")({
  staticData: { title: copy.meta.title },
  head: ({ match }) => {
    const metadata = generatePageMetadata(copy.meta);

    return {
      ...metadata,
      links: [
        ...metadata.links,
        { rel: "stylesheet", href: styles },
        {
          rel: "preload",
          href: match.context.christmas ? "/Mitzi-hero-christmas.webp" : "/Mitzi-hero.webp",
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
  return (
    <main className="home-page">
      <HomeHero />
      <div className="home-intro">
        <Intro />
        <section className="home-social" aria-labelledby="home-social-title">
          <h2 className="home-social__title" id="home-social-title">
            {copy.social.title}
          </h2>
          <nav aria-label={copy.social.label}>
            <ul className="home-social__list">
              {copy.social.profiles.map((profile) => (
                <li key={profile.name}>
                  <SocialLink profile={profile} />
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </div>
    </main>
  );
}
