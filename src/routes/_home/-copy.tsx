import type { ReactNode } from "react";

export const meta = {
  title: "Home",
  description: "Welcome to my personal website!",
} as const;

export const hero = {
  title: "Hi, I'm eskimojo.",
  controls: {
    play: "Resume animation",
    pause: "Pause animation",
    next: "Next role",
  },
  roles: [
    "a web developer",
    "an open source contributor",
    "a Redux maintainer",
    "a musician",
    "an Overwatch casual",
    "a cat dad",
  ],
  roleFormatter: new Intl.ListFormat("en", { style: "long", type: "conjunction" }),
  roleDisplay: (role: ReactNode) => <>I'm {role}</>,
} as const;

export type SocialProfileName = "GitHub" | "Twitter" | "Bluesky";

export interface SocialProfile {
  name: SocialProfileName;
  handle: string;
  href: string;
}

export const social = {
  title: "Find me elsewhere",
  label: "Social profiles",
  linkLabel: ({ handle, name }: SocialProfile) => `${name} profile, ${handle}, opens in a new tab`,
  profiles: [
    {
      name: "GitHub",
      handle: "@EskiMojo14",
      href: "https://github.com/EskiMojo14",
    },
    {
      name: "Twitter",
      handle: "@eskimojo",
      href: "https://twitter.com/eskimojo",
    },
    {
      name: "Bluesky",
      handle: "@eskimojo.bsky.social",
      href: "https://bsky.app/profile/eskimojo.bsky.social",
    },
  ] as const satisfies Array<SocialProfile>,
} as const;
