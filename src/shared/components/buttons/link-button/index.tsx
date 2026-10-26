import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import type { ButtonSize, ButtonVariant } from "#/shared/components/buttons/button";
import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const buttonBem = BEMHelper("button");

export interface ExternalLinkButtonProps extends ComponentPropsWithRef<"a">, TooltipProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

function LinkButtonBase({
  variant = "filled",
  size = "small",
  className,
  icon,
  children,
  ...props
}: Omit<ExternalLinkButtonProps, keyof TooltipProps>) {
  return (
    <a {...props} {...buttonBem({ modifier: [variant, size], extra: className })}>
      {!!icon && (
        <span {...buttonBem({ element: "icon" })} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </a>
  );
}

export const ExternalLinkButton = withTooltip(
  (props: Omit<ExternalLinkButtonProps, keyof TooltipProps>) => (
    <LinkButtonBase target="_blank" rel="noopener noreferrer" {...props} />
  ),
);
export const InternalLinkButton = createLink(withTooltip(LinkButtonBase));
