import type { ComponentPropsWithRef } from "react";

import { createBem } from "#/shared/lib/bem";

const listBem = createBem("list");

export function List({ className, ...props }: ComponentPropsWithRef<"ul">) {
  return <ul {...props} {...listBem({ extra: className })} />;
}

export function ListItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li {...props} {...listBem({ element: "item", extra: className })} />;
}

export function ListDivider() {
  return <li {...listBem({ element: "divider" })} aria-hidden="true" />;
}
