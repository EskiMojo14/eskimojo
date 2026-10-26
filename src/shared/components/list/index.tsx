import { Link } from "@tanstack/react-router";
import {
  cloneElement,
  isValidElement,
  type ComponentPropsWithRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import BEMHelper from "react-bem-helper";

import { useRipple } from "#/shared/components/ripple";

const listBem = BEMHelper("list");

export interface ListProps extends ComponentPropsWithRef<"ul"> {
  variant?: "navigation" | "expressive";
}

export function List({ variant = "expressive", className, ...props }: ListProps) {
  return <ul {...props} {...listBem({ modifier: variant, extra: className })} />;
}

type ListItemActionProps = HTMLAttributes<HTMLElement> & { disabled?: boolean };

function ListItemAction({ action }: { action: ReactElement<ListItemActionProps> }) {
  const { handlers, ripple } = useRipple<HTMLElement>(action.props);
  return cloneElement(action, handlers, ripple, action.props.children);
}

export function ListItem({ className, children, ...props }: ComponentPropsWithRef<"li">) {
  const interactive =
    isValidElement<ListItemActionProps>(children) &&
    (children.type === "a" || children.type === "button" || children.type === Link);
  return (
    <li {...props} {...listBem({ element: "item", extra: className })}>
      {interactive ? <ListItemAction action={children} /> : children}
    </li>
  );
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
