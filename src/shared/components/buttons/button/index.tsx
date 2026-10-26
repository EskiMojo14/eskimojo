import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const buttonBem = BEMHelper("button");

export type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";
export type ButtonSize = "extra-small" | "small" | "medium" | "large" | "extra-large";

export interface ButtonProps extends ComponentPropsWithRef<"button">, TooltipProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

function ButtonBase({
  variant = "filled",
  size = "small",
  type = "button",
  className,
  icon,
  children,
  ...props
}: Omit<ButtonProps, keyof TooltipProps>) {
  return (
    <button {...props} {...buttonBem({ modifier: [variant, size], extra: className })} type={type}>
      {!!icon && (
        <span {...buttonBem({ element: "icon" })} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

export const Button = withTooltip(ButtonBase);
