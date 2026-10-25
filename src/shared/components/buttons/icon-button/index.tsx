import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

const iconButtonBem = BEMHelper("icon-button");

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";

export type IconButtonProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-label" | "aria-labelledby" | "children"
> & {
  variant?: IconButtonVariant;
  icon: ReactNode;
} & (
    | { "aria-label": string; "aria-labelledby"?: never }
    | { "aria-label"?: never; "aria-labelledby": string }
  );

export function IconButton({
  variant = "standard",
  type = "button",
  className,
  icon,
  ...props
}: IconButtonProps) {
  return (
    <button {...props} {...iconButtonBem({ modifier: variant, extra: className })} type={type}>
      <span {...iconButtonBem({ element: "icon" })} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
