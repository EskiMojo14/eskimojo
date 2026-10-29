import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

const skeletonBem = BEMHelper("skeleton");

export function Skeleton({ className, ...props }: Omit<ComponentPropsWithRef<"span">, "children">) {
  return <span {...props} {...skeletonBem({ extra: className })} aria-hidden="true" />;
}

export function SkeletonProgress({ label }: { label: string }) {
  return <progress {...skeletonBem({ element: "progress" })} aria-label={label} />;
}
