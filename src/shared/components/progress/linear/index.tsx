import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { getProgressValue } from "#/shared/lib/progress";

const progressBem = BEMHelper("linear-progress");

export interface LinearProgressProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  label: string;
  value?: number;
  max?: number;
}

export function LinearProgress({
  label,
  value,
  max = 1,
  className,
  style,
  ...props
}: LinearProgressProps) {
  const progress = getProgressValue(value, max);
  return (
    <span
      {...props}
      {...progressBem({
        modifier: progress === undefined ? "indeterminate" : "determinate",
        extra: className,
      })}
      style={{
        "--linear-progress-value":
          progress === undefined ? undefined : `${(progress / max) * 100}%`,
        ...style,
      }}
    >
      <progress
        {...progressBem({ element: "semantics" })}
        aria-label={label}
        value={progress}
        max={max}
      />
      <span {...progressBem({ element: "visual" })} aria-hidden="true">
        <span {...progressBem({ element: "track", modifier: "leading" })} />
        <span {...progressBem({ element: "track", modifier: "trailing" })} />
        <span {...progressBem({ element: "indicator" })} hidden={progress === 0} />
        {progress !== undefined && progress < max && <span {...progressBem({ element: "stop" })} />}
      </span>
    </span>
  );
}
