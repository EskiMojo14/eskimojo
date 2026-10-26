import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import type { IconButtonVariant } from "#/shared/components/buttons/icon-button";
import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const iconButtonBem = BEMHelper("icon-button");

type LinkIconButtonBaseProps = Omit<
  ComponentPropsWithRef<"a">,
  "aria-label" | "aria-labelledby" | "children"
> & {
  variant?: IconButtonVariant;
  icon: ReactNode;
} & (
    | { "aria-label": string; "aria-labelledby"?: never }
    | { "aria-label"?: never; "aria-labelledby": string }
  );

export type ExternalLinkIconButtonProps = LinkIconButtonBaseProps & TooltipProps;

function LinkIconButtonBase({
  variant = "standard",
  className,
  icon,
  ...props
}: LinkIconButtonBaseProps) {
  return (
    <a {...props} {...iconButtonBem({ modifier: variant, extra: className })}>
      <span {...iconButtonBem({ element: "icon" })} aria-hidden="true">
        {icon}
      </span>
    </a>
  );
}

export const ExternalLinkIconButton = withTooltip((props: LinkIconButtonBaseProps) => (
  <LinkIconButtonBase target="_blank" rel="noopener noreferrer" {...props} />
));
export const InternalLinkIconButton = createLink(withTooltip(LinkIconButtonBase));
