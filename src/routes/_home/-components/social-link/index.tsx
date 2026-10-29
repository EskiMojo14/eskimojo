import type { ReactNode } from "react";

import { Card } from "#/shared/components/card";
import { useRipple } from "#/shared/components/ripple";
import { MdSymbol } from "#/shared/components/symbol";

export interface SocialLinkProps {
  name: string;
  handle: string;
  href: string;
  icon: ReactNode;
}

export function SocialLink({ name, handle, href, icon }: SocialLinkProps) {
  const { handlers, ripple } = useRipple<HTMLAnchorElement>();

  return (
    <a
      {...handlers}
      className="home-social-link"
      href={href}
      aria-label={`${name} profile, ${handle}, opens in a new tab`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {ripple}
      <Card className="home-social-link__card" variant="elevated">
        <span className="home-social-link__brand-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="home-social-link__name">{name}</span>
        <span className="home-social-link__handle">{handle}</span>
        <MdSymbol className="home-social-link__external-icon">arrow_outward</MdSymbol>
      </Card>
    </a>
  );
}
