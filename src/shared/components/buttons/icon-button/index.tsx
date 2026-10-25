import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const iconButtonBem = BEMHelper("icon-button");

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";

type IconButtonBaseProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-label" | "aria-labelledby" | "children"
> & {
  variant?: IconButtonVariant;
  icon: ReactNode;
} & (
    | { "aria-label": string; "aria-labelledby"?: never }
    | { "aria-label"?: never; "aria-labelledby": string }
  );

export type IconButtonProps = IconButtonBaseProps & TooltipProps;

function IconButtonBase({
  variant = "standard",
  type = "button",
  className,
  icon,
  ...props
}: IconButtonBaseProps) {
  return (
    <button {...props} {...iconButtonBem({ modifier: variant, extra: className })} type={type}>
      <span {...iconButtonBem({ element: "icon" })} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

export const IconButton = withTooltip(IconButtonBase);
