import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

const emptyStateBem = BEMHelper("empty-state");

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<"div">, "children" | "title"> {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon, title, description, className, ...props }: EmptyStateProps) {
  return (
    <div {...props} {...emptyStateBem({ extra: className })}>
      <div {...emptyStateBem({ element: "icon" })} aria-hidden="true">
        {icon}
      </div>
      <h2 {...emptyStateBem({ element: "title" })}>{title}</h2>
      <p {...emptyStateBem({ element: "description" })}>{description}</p>
    </div>
  );
}
