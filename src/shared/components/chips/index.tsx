import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { useId } from "react";
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

function SelectionIcon({ icon }: Pick<AssistChipProps, "icon">) {
  const maskId = useId();
  return (
    <span
      {...chipBem({
        element: "icon",
        extra: chipBem({
          element: "selection",
          modifier: { "with-icon": !!icon },
        }).className,
      })}
      aria-hidden="true"
    >
      {!!icon && <span {...chipBem({ element: "leading-icon" })}>{icon}</span>}
      <svg {...chipBem({ element: "check-mask" })} width="0" height="0" focusable="false">
        <defs>
          <mask id={maskId} maskContentUnits="objectBoundingBox">
            <path
              {...chipBem({ element: "check-reveal" })}
              d="M .16 .46 L .398 .70 L .85 .25"
              pathLength="1"
              fill="none"
              stroke="white"
              strokeWidth=".16"
            />
          </mask>
        </defs>
      </svg>
      <MdSymbol {...chipBem({ element: "check" })} style={{ maskImage: `url("#${maskId}")` }}>
        check
      </MdSymbol>
    </span>
  );
}

export function FilterChip({
  selected,
  icon,
  type = "button",
  className,
  children,
  ...props
}: FilterChipProps) {
  return (
    <button {...props} type={type} {...chipBem({ extra: className })} aria-pressed={selected}>
      <SelectionIcon icon={icon} />
      {children}
    </button>
  );
}

export interface ExternalLinkChipProps extends ComponentPropsWithRef<"a"> {
  icon?: ReactNode;
}

function LinkChipBase({ icon, className, children, ...props }: ExternalLinkChipProps) {
  return (
    <a {...props} {...chipBem({ extra: className })}>
      <SelectionIcon icon={icon} />
      {children}
    </a>
  );
}

export function ExternalLinkChip(props: ExternalLinkChipProps) {
  return <LinkChipBase target="_blank" rel="noopener noreferrer" {...props} />;
}

export const InternalLinkChip = createLink(LinkChipBase);

export type ChipGroupProps = Omit<ComponentPropsWithRef<"fieldset">, "role"> &
  ({ "aria-label": string } | { "aria-labelledby": string });

export function ChipGroup({ className, ...props }: ChipGroupProps) {
  return <fieldset {...props} {...chipGroupBem({ extra: className })} />;
}
