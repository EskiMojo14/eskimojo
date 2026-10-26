import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import type { ButtonVariant } from "#/shared/components/buttons/button";
import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const buttonBem = BEMHelper("button");

export interface ExternalLinkButtonProps extends ComponentPropsWithRef<"a">, TooltipProps {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

function LinkButtonBase({
  variant = "filled",
  className,
  icon,
  children,
  ...props
}: Omit<ExternalLinkButtonProps, keyof TooltipProps>) {
  return (
    <a {...props} {...buttonBem({ modifier: variant, extra: className })}>
      {!!icon && (
        <span {...buttonBem({ element: "icon" })} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </a>
  );
}

export const ExternalLinkButton = withTooltip(LinkButtonBase);
export const InternalLinkButton = createLink(ExternalLinkButton);
