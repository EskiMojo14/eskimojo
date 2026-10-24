import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

const listBem = BEMHelper("list");

export function List({ className, ...props }: ComponentPropsWithRef<"ul">) {
  return <ul {...props} {...listBem({ extra: className })} />;
}

export function ListItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li {...props} {...listBem({ element: "item", extra: className })} />;
}

export function ListDivider() {
  return <li {...listBem({ element: "divider" })} aria-hidden="true" />;
}
