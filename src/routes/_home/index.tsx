import { createFileRoute } from "@tanstack/react-router";

import { generatePageMetadata } from "#/shared/lib/document-head";

import { HomeHero } from "./-components/home-hero";
import { SocialLink } from "./-components/social-link";
import BlueskyIcon from "./-components/social-link/icons/bluesky.svg?react";
import GitHubIcon from "./-components/social-link/icons/github.svg?react";
import TwitterIcon from "./-components/social-link/icons/twitter.svg?react";
import Intro from "./-intro.mdx";

import socialLinkStyles from "./-components/social-link/index.css?url";
import styles from "./index.css?url";

const socialProfiles = [
  {
    name: "GitHub",
    handle: "@EskiMojo14",
    href: "https://github.com/EskiMojo14",
    Icon: GitHubIcon,
  },
  {
    name: "Twitter",
    handle: "@eskimojo",
    href: "https://twitter.com/eskimojo",
    Icon: TwitterIcon,
  },
  {
    name: "Bluesky",
    handle: "@eskimojo.bsky.social",
    href: "https://bsky.app/profile/eskimojo.bsky.social",
    Icon: BlueskyIcon,
  },
];

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
        { rel: "stylesheet", href: socialLinkStyles },
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
  return (
    <>
      <HomeHero />
      <div className="home-intro">
        <Intro />
        <section className="home-social" aria-labelledby="home-social-title">
          <h2 className="home-social__title" id="home-social-title">
            Find me elsewhere
          </h2>
          <nav aria-label="Social profiles">
            <ul className="home-social__list">
              {socialProfiles.map((profile) => (
                <li key={profile.name}>
                  <SocialLink
                    name={profile.name}
                    handle={profile.handle}
                    href={profile.href}
                    icon={<profile.Icon aria-hidden="true" />}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </div>
    </>
  );
}
