import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import type { ButtonSize } from "#/shared/components/buttons/button";
import { useRipple } from "#/shared/components/ripple";
import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const iconButtonBem = BEMHelper("icon-button");

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";

type IconButtonBaseProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-label" | "aria-labelledby" | "children"
> & {
  variant?: IconButtonVariant;
  size?: ButtonSize;
  icon: ReactNode;
} & (
    | { "aria-label": string; "aria-labelledby"?: never }
    | { "aria-label"?: never; "aria-labelledby": string }
  );

export type IconButtonProps = IconButtonBaseProps & TooltipProps;

function IconButtonBase({
  variant = "standard",
  size = "small",
  type = "button",
  className,
  icon,
  ...props
}: IconButtonBaseProps) {
  const { handlers, ripple } = useRipple<HTMLButtonElement>(props, true);
  return (
    <button
      {...props}
      {...handlers}
      {...iconButtonBem({ modifier: [variant, size], extra: className })}
      type={type}
    >
      {ripple}
      <span {...iconButtonBem({ element: "icon" })} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

export const IconButton = withTooltip(IconButtonBase);
