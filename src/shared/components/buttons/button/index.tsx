import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { CircularProgress } from "#/shared/components/progress/circular";
import { useRipple } from "#/shared/components/ripple";
import { withTooltip, type TooltipProps } from "#/shared/components/tooltip";

const buttonBem = BEMHelper("button");

export type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";
export type ButtonSize = "extra-small" | "small" | "medium" | "large" | "extra-large";

export type ButtonProps = ComponentPropsWithRef<"button"> &
  TooltipProps & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    loading?: boolean;
  };

function ButtonBase({
  variant = "filled",
  size = "small",
  type = "button",
  className,
  icon,
  children,
  loading = false,
  onClick,
  ...props
}: Omit<ButtonProps, keyof TooltipProps>) {
  const { handlers, ripple } = useRipple<HTMLButtonElement>({
    ...props,
    "aria-disabled": loading || props["aria-disabled"],
  });
  return (
    <button
      {...props}
      {...handlers}
      {...buttonBem({ modifier: [variant, size, loading ? "loading" : ""], extra: className })}
      type={type}
      aria-busy={loading || props["aria-busy"]}
      aria-disabled={loading || props["aria-disabled"]}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {ripple}
      {!!icon && (
        <span {...buttonBem({ element: "icon" })} aria-hidden="true">
          {icon}
        </span>
      )}
      <span {...buttonBem({ element: "label" })}>{children}</span>
      {loading && (
        <span {...buttonBem({ element: "progress" })} aria-hidden="true">
          <CircularProgress label="Loading" track={false} />
        </span>
      )}
    </button>
  );
}

export const Button = withTooltip(ButtonBase);
