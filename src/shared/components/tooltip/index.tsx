import {
  useEffect,
  useId,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import BEMHelper from "react-bem-helper";

const tooltipBem = BEMHelper("tooltip");

export interface RichTooltipProps {
  subhead?: string;
  supporting: ReactNode;
  actions?: ReactNode;
  actionsLabel?: string;
}

export interface TooltipOptions {
  placement?: "top" | "bottom" | "left" | "right";
  /** Hover delay in milliseconds. Keyboard focus shows the tooltip immediately. */
  delay?: number;
}

export type TooltipProps = {
  tooltipOpts?: TooltipOptions;
  popoverRef?: Ref<HTMLDivElement>;
} & (
  | {
      tooltip?: string;
      /** Use non-empty plain tooltip text as the trigger's accessible name. */
      tooltipAsLabel?: boolean;
    }
  | { tooltip: RichTooltipProps; tooltipAsLabel?: false }
);

type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };
type TriggerStyle = CSSProperties & { "--tooltip-delay"?: string };

let interestPolyfill: Promise<void> | undefined;

function loadInterestPolyfill() {
  return (interestPolyfill ??= (async () => {
    // Modern Firefox/Safari still need interest invokers, not Popover or anchor polyfills.
    if (!Object.hasOwn(HTMLButtonElement.prototype, "interestForElement")) {
      await import("interestfor");
    }
  })());
}

/**
 * Adds plain or rich hints without inserting a wrapper around the trigger.
 * The component must forward its ref and HTML attributes to a button or link.
 */
export function withTooltip<P extends TriggerProps>(
  Component: ComponentType<P>,
  defaults: TooltipOptions = {},
) {
  function WithTooltip(allProps: P & TooltipProps) {
    const { tooltip, tooltipOpts, popoverRef, ref, id: idProp, style } = allProps;
    const componentProps = { ...allProps };
    delete componentProps.tooltip;
    delete componentProps.tooltipAsLabel;
    delete componentProps.tooltipOpts;
    delete componentProps.popoverRef;
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const tooltipId = `${id}-tooltip`;
    const { placement = "bottom", delay = 500 } = { ...defaults, ...tooltipOpts };
    const anchorName = `--tooltip-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const hasTooltip = tooltip !== undefined && tooltip !== "";
    const rich = typeof tooltip === "object";

    useEffect(() => {
      if (!hasTooltip) return undefined;
      void loadInterestPolyfill().catch((error: unknown) => {
        console.error("Unable to load tooltip browser support.", error);
      });
      const dismiss = (event: KeyboardEvent) => {
        const hint = document.getElementById(tooltipId);
        if (event.key === "Escape" && !event.defaultPrevented && hint?.matches(":popover-open")) {
          // Consume Escape so it cannot also close an enclosing popover.
          event.preventDefault();
          hint.hidePopover();
        }
      };
      document.addEventListener("keydown", dismiss, true);
      return () => document.removeEventListener("keydown", dismiss, true);
    }, [hasTooltip, tooltipId]);

    const triggerStyle: TriggerStyle = {
      ...style,
      ...(hasTooltip ? { "--tooltip-delay": `${delay}ms`, anchorName } : {}),
    };

    return (
      <>
        <Component
          {...componentProps}
          id={id}
          ref={ref}
          style={triggerStyle}
          {...(hasTooltip && !rich && allProps.tooltipAsLabel
            ? { "aria-labelledby": tooltipId }
            : {})}
          {...(hasTooltip ? { interestfor: tooltipId, "data-tooltip-trigger": "" } : {})}
        />
        {hasTooltip && (
          <div
            {...tooltipBem({ modifier: rich ? "rich" : "plain" })}
            id={tooltipId}
            ref={popoverRef}
            popover="hint"
            role={rich ? "dialog" : undefined}
            aria-label={rich && !tooltip.subhead ? "More information" : undefined}
            aria-labelledby={rich && tooltip.subhead ? `${tooltipId}-subhead` : undefined}
            style={{ positionAnchor: anchorName }}
            data-placement={placement}
          >
            {rich ? (
              <>
                {tooltip.subhead && (
                  <h2 {...tooltipBem("subhead")} id={`${tooltipId}-subhead`}>
                    {tooltip.subhead}
                  </h2>
                )}
                <div {...tooltipBem("supporting")}>{tooltip.supporting}</div>
                {tooltip.actions && (
                  <fieldset
                    {...tooltipBem("actions")}
                    aria-label={tooltip.actionsLabel ?? "Actions"}
                  >
                    {tooltip.actions}
                  </fieldset>
                )}
              </>
            ) : (
              tooltip
            )}
          </div>
        )}
      </>
    );
  }

  WithTooltip.displayName = `withTooltip(${Component.displayName ?? Component.name})`;
  return WithTooltip;
}
