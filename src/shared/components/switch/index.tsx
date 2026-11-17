import { useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import BEMHelper from "react-bem-helper";

const switchBem = BEMHelper("switch");
const nativeSwitchAttributes = {
  type: "checkbox",
  switch: "",
} satisfies ComponentPropsWithRef<"input"> & { switch: "" };

export interface SwitchProps extends Omit<
  ComponentPropsWithRef<"input">,
  "aria-checked" | "children" | "role" | "type"
> {
  label: string;
  onIcon?: ReactNode;
  offIcon?: ReactNode;
}

export function Switch({
  label,
  onIcon,
  offIcon,
  className,
  checked,
  defaultChecked,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: SwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const isControlled = checked !== undefined;
  const isChecked = checked ?? uncontrolledChecked;

  return (
    <label
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
      <span {...switchBem({ element: "label" })}>{label}</span>
    </label>
  );
}
