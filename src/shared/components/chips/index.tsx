import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { MdSymbol } from "#/shared/components/symbol";

const chipBem = BEMHelper("chip");
const chipGroupBem = BEMHelper("chip-group");

export interface AssistChipProps extends ComponentPropsWithRef<"button"> {
  icon?: ReactNode;
}

export function AssistChip({
  icon,
  type = "button",
  className,
  children,
  ...props
}: AssistChipProps) {
  return (
    <button {...props} type={type} {...chipBem({ extra: className })}>
      {!!icon && (
        <span {...chipBem({ element: "icon" })} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

export interface FilterChipProps extends Omit<AssistChipProps, "aria-pressed"> {
  selected: boolean;
}

export function FilterChip({ selected, icon, ...props }: FilterChipProps) {
  return (
    <AssistChip
      {...props}
      aria-pressed={selected}
      icon={selected ? <MdSymbol>check</MdSymbol> : icon}
    />
  );
}

export interface ExternalLinkChipProps extends ComponentPropsWithRef<"a"> {
  icon?: ReactNode;
}

export function ExternalLinkChip({ icon, className, children, ...props }: ExternalLinkChipProps) {
  const current = props["aria-current"];
  const selected = current !== undefined && current !== false && current !== "false";
  return (
    <a {...props} {...chipBem({ extra: className })}>
      {(selected || !!icon) && (
        <span {...chipBem({ element: "icon" })} aria-hidden="true">
          {selected ? <MdSymbol>check</MdSymbol> : icon}
        </span>
      )}
      {children}
    </a>
  );
}

export const InternalLinkChip = createLink(ExternalLinkChip);

export type ChipGroupProps = Omit<ComponentPropsWithRef<"fieldset">, "role"> &
  ({ "aria-label": string } | { "aria-labelledby": string });

export function ChipGroup({ className, ...props }: ChipGroupProps) {
  return <fieldset {...props} {...chipGroupBem({ extra: className })} />;
}
