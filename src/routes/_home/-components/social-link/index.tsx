import type { SocialProfile } from "#/routes/_home/-copy";
import * as copy from "#/routes/_home/-copy";
import { Card } from "#/shared/components/card";
import { useRipple } from "#/shared/components/ripple";
import { MdSymbol } from "#/shared/components/symbol";

import { icons } from "./icons";

export interface SocialLinkProps {
  profile: SocialProfile;
}

export function SocialLink({ profile, profile: { name, handle, href } }: SocialLinkProps) {
  const { handlers, ripple } = useRipple<HTMLAnchorElement>();

  const Icon = icons[name];

  return (
    <a
      {...handlers}
      className="home-social-link"
      href={href}
      aria-label={copy.social.linkLabel(profile)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {ripple}
      <Card className="home-social-link__card" variant="elevated">
        <span className="home-social-link__brand-icon" aria-hidden="true">
          <Icon aria-hidden="true" />
        </span>
        <span className="home-social-link__name">{name}</span>
        <span className="home-social-link__handle">{handle}</span>
        <MdSymbol className="home-social-link__external-icon">arrow_outward</MdSymbol>
      </Card>
    </a>
  );
}
