import { useState, type ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { useHapticFeedback } from "#/shared/lib/haptics";

const radioBem = BEMHelper("radio");

interface RadioBaseProps extends Omit<
  ComponentPropsWithRef<"input">,
  "aria-checked" | "children" | "role" | "type"
> {
  hapticFeedback?: boolean;
}

export type RadioProps = RadioBaseProps &
  (
    | { label: string }
    | { label?: never; "aria-label": string }
    | { label?: never; "aria-labelledby": string }
  );

export function Radio({
  label,
  hapticFeedback = true,
  className,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: RadioProps) {
  const { triggerHapticFeedback } = useHapticFeedback();
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const Component = label === undefined ? "span" : "label";

  return (
    <Component
      {...radioBem({ extra: className })}
      data-keyboard-pressed={keyboardPressed || undefined}
    >
      <input
        {...props}
        {...radioBem({ element: "input" })}
        type="radio"
        onChange={(event) => {
          onChange?.(event);

          if (hapticFeedback && !event.defaultPrevented) triggerHapticFeedback("selection");
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (event.key === " " && !event.defaultPrevented) setKeyboardPressed(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);

          if (event.key === " ") setKeyboardPressed(false);
        }}
        onBlur={(event) => {
          setKeyboardPressed(false);
          onBlur?.(event);
        }}
      />
      <span {...radioBem({ element: "control" })} aria-hidden="true">
        <span {...radioBem({ element: "ring" })} />
      </span>
      {label !== undefined && <span {...radioBem({ element: "label" })}>{label}</span>}
    </Component>
  );
}
