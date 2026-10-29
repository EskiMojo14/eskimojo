import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { getProgressValue } from "#/shared/lib/progress";

const progressBem = BEMHelper("circular-progress");

// Arcs without pathLength: Chrome's circle and pathLength dash scaling drift from the caps' exact angles.
const ringPath = "M36 20A16 16 0 0 1 4 20A16 16 0 0 1 36 20";

/**
 * A diamond straddling the stroke's end at 3 o'clock; the half beyond the end
 * forms a cut-corner cap. CSS rotates it to the matching dash boundary.
 */
function Cap({
  modifier,
}: {
  modifier: "indicator-start" | "indicator-end" | "track-start" | "track-end";
}) {
  return <path {...progressBem({ element: "cap", modifier })} d="M36 18 38 20 36 22 34 20Z" />;
}

export interface CircularProgressProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  label: string;
  value?: number;
  max?: number;
  track?: boolean;
}

export function CircularProgress({
  label,
  value,
  max = 1,
  track = true,
  className,
  style,
  ...props
}: CircularProgressProps) {
  const progress = getProgressValue(value, max);
  return (
    <span
      {...props}
      {...progressBem({
        modifier: progress === undefined ? "indeterminate" : "determinate",
        extra: className,
      })}
      style={{
        "--circular-progress-value": progress === undefined ? undefined : (progress / max) * 100,
        ...style,
      }}
    >
      <progress
        {...progressBem({ element: "semantics" })}
        aria-label={label}
        value={progress}
        max={max}
      />
      <svg
        {...progressBem({ element: "visual" })}
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
      >
        {track && (
          <g visibility={progress === max ? "hidden" : undefined}>
            <path {...progressBem({ element: "track" })} d={ringPath} />
            {progress !== 0 && (
              <>
                <Cap modifier="track-start" />
                <Cap modifier="track-end" />
              </>
            )}
          </g>
        )}
        <g visibility={progress === 0 ? "hidden" : undefined}>
          <path {...progressBem({ element: "indicator" })} d={ringPath} />
          {progress !== max && (
            <>
              <Cap modifier="indicator-start" />
              <Cap modifier="indicator-end" />
            </>
          )}
        </g>
      </svg>
    </span>
  );
}
