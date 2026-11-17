import { useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { useHapticFeedback } from "#/shared/lib/haptics";

const switchBem = BEMHelper("switch");
const nativeSwitchAttributes = {
  type: "checkbox",
  switch: "",
} satisfies ComponentPropsWithRef<"input"> & { switch: "" };

interface SwitchBaseProps extends Omit<
  ComponentPropsWithRef<"input">,
  "aria-checked" | "children" | "role" | "type"
> {
  onIcon?: ReactNode;
  offIcon?: ReactNode;
  hapticFeedback?: boolean;
}

export type SwitchProps = SwitchBaseProps &
  (
    | { label: string }
    | { label?: never; "aria-label": string }
    | { label?: never; "aria-labelledby": string }
  );

export function Switch({
  label,
  onIcon,
  offIcon,
  hapticFeedback = true,
  className,
  checked,
  defaultChecked,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: SwitchProps) {
  const { triggerHapticFeedback } = useHapticFeedback();
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const isControlled = checked !== undefined;
  const isChecked = checked ?? uncontrolledChecked;
  const Component = label === undefined ? "span" : "label";

  return (
    <Component
      {...switchBem({ extra: className })}
      data-keyboard-pressed={keyboardPressed || undefined}
    >
      <input
        {...switchBem({ element: "input" })}
        {...props}
        {...nativeSwitchAttributes}
        checked={isChecked}
        aria-checked={isChecked}
        role="switch"
        onChange={(event) => {
          if (!isControlled) setUncontrolledChecked(event.currentTarget.checked);
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
      <span {...switchBem({ element: "track" })} aria-hidden="true">
        <span {...switchBem({ element: "thumb" })}>
          {!!onIcon && (
            <span {...switchBem({ element: "icon", modifier: "selected" })}>{onIcon}</span>
          )}
          {!!offIcon && (
            <span {...switchBem({ element: "icon", modifier: "unselected" })}>{offIcon}</span>
          )}
        </span>
      </span>
      {label !== undefined && <span {...switchBem({ element: "label" })}>{label}</span>}
    </Component>
  );
}
