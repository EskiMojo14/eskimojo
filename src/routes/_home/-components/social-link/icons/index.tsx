import type { SocialProfileName } from "#/routes/_home/-copy";

import BlueskyIcon from "./bluesky.svg?react";
import GitHubIcon from "./github.svg?react";
import TwitterIcon from "./twitter.svg?react";

export const icons = {
  GitHub: GitHubIcon,
  Twitter: TwitterIcon,
  Bluesky: BlueskyIcon,
} satisfies Record<SocialProfileName, React.ComponentType>;
