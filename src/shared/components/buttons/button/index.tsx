import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const buttonBem = BEMHelper("button");

export type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";

export interface ButtonProps extends ComponentPropsWithRef<"button">, TooltipProps {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

function ButtonBase({
  variant = "filled",
  type = "button",
  className,
  icon,
  children,
  ...props
}: Omit<ButtonProps, keyof TooltipProps>) {
  return (
    <button {...props} {...buttonBem({ modifier: variant, extra: className })} type={type}>
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
