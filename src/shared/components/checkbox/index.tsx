import { useState, type ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { MdSymbol } from "#/shared/components/symbol";
import { useHapticFeedback } from "#/shared/lib/haptics";
import { mergeRefs } from "#/utils";

const checkboxBem = BEMHelper("checkbox");

interface CheckboxBaseProps extends Omit<
  ComponentPropsWithRef<"input">,
  "aria-checked" | "children" | "role" | "type"
> {
  indeterminate?: boolean;
  hapticFeedback?: boolean;
}

export type CheckboxProps = CheckboxBaseProps &
  (
    | { label: string }
    | { label?: never; "aria-label": string }
    | { label?: never; "aria-labelledby": string }
  );

export function Checkbox({
  label,
  indeterminate = false,
  hapticFeedback = true,
  className,
  ref,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: CheckboxProps) {
  const { triggerHapticFeedback } = useHapticFeedback();
  const [keyboardPressed, setKeyboardPressed] = useState(false);
  const Component = label === undefined ? "span" : "label";

  return (
    <Component
      {...checkboxBem({ extra: className })}
      data-keyboard-pressed={keyboardPressed || undefined}
    >
      <input
        {...props}
        {...checkboxBem({ element: "input" })}
        type="checkbox"
        ref={mergeRefs(ref, (input) => {
          if (input) input.indeterminate = indeterminate;
        })}
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
      <span {...checkboxBem({ element: "control" })} aria-hidden="true">
        <span {...checkboxBem({ element: "box" })}>
          <span {...checkboxBem({ element: "icon", modifier: "checked" })}>
            <MdSymbol>check</MdSymbol>
          </span>
          <span {...checkboxBem({ element: "icon", modifier: "indeterminate" })}>
            <MdSymbol>remove</MdSymbol>
          </span>
        </span>
      </span>
      {label !== undefined && <span {...checkboxBem({ element: "label" })}>{label}</span>}
    </Component>
  );
}
