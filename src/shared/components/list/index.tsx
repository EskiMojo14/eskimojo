import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

const listBem = BEMHelper("list");

export interface ListProps extends ComponentPropsWithRef<"ul"> {
  variant?: "navigation" | "expressive";
}

export function List({ variant = "expressive", className, ...props }: ListProps) {
  return <ul {...props} {...listBem({ modifier: variant, extra: className })} />;
}

export function ListItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li {...props} {...listBem({ element: "item", extra: className })} />;
}

export function ListDivider() {
  return <li {...listBem({ element: "divider" })} aria-hidden="true" />;
}

export interface ListItemContentProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  headline: ReactNode;
  supportingText?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function ListItemContent({
  headline,
  supportingText,
  leading,
  trailing,
  className,
  ...props
}: ListItemContentProps) {
  return (
    <span {...props} {...listBem({ element: "content", extra: className })}>
      {leading != null && <span {...listBem({ element: "leading" })}>{leading}</span>}
      <span {...listBem({ element: "text" })}>
        <span {...listBem({ element: "headline" })}>{headline}</span>
        {supportingText != null && (
          <span {...listBem({ element: "supporting" })}>{supportingText}</span>
        )}
      </span>
      {trailing != null && <span {...listBem({ element: "trailing" })}>{trailing}</span>}
    </span>
  );
}
