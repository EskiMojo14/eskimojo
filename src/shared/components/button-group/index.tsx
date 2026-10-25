import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import BEMHelper from "react-bem-helper";

const groupBem = BEMHelper("button-group");

export type ButtonGroupProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  variant?: "standard" | "connected";
} & ({ "aria-label": string } | { "aria-labelledby": string });

function buttonsIn(group: HTMLDivElement) {
  return Array.from(group.querySelectorAll<HTMLButtonElement>(":scope > button"));
}

function availableButtons(group: HTMLDivElement) {
  return buttonsIn(group).filter(
    (button) =>
      !button.matches(
        ':disabled, [aria-disabled="true"], [hidden], [hidden] *, [inert], [inert] *',
      ) && button.checkVisibility({ visibilityProperty: true }),
  );
}

function setTabStop(group: HTMLDivElement, active: HTMLButtonElement | undefined) {
  for (const button of buttonsIn(group)) {
    button.tabIndex = button === active ? 0 : -1;
  }
}

export function ButtonGroup({
  variant = "standard",
  className,
  children,
  onKeyDown,
  onFocus,
  ...props
}: ButtonGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement | undefined>(undefined);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return undefined;
    const originalTabIndexes = new Map<HTMLButtonElement, string | null>();
    const synchronize = () => {
      for (const button of buttonsIn(group)) {
        if (!originalTabIndexes.has(button)) {
          originalTabIndexes.set(button, button.getAttribute("tabindex"));
        }
      }
      const available = availableButtons(group);
      const active = activeRef.current;
      activeRef.current =
        active && available.includes(active)
          ? active
          : (available.find((button) => button.getAttribute("aria-pressed") === "true") ??
            available[0]);
      setTabStop(group, activeRef.current);
    };
    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(group, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "hidden", "inert", "aria-pressed"],
    });
    return () => {
      observer.disconnect();
      for (const [button, tabIndex] of originalTabIndexes) {
        if (tabIndex === null) button.removeAttribute("tabindex");
        else button.setAttribute("tabindex", tabIndex);
      }
    };
  }, []);

  return (
    <div
      {...props}
      {...groupBem({ modifier: variant, extra: className })}
      ref={groupRef}
      role="toolbar"
      tabIndex={-1}
      aria-orientation="horizontal"
      onFocus={(event) => {
        onFocus?.(event);
        const buttons = availableButtons(event.currentTarget);
        if (event.target instanceof HTMLButtonElement && buttons.includes(event.target)) {
          activeRef.current = event.target;
          setTabStop(event.currentTarget, event.target);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.nativeEvent.isComposing
        )
          return;
        const group = event.currentTarget;
        const buttons = availableButtons(group);
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        const index = buttons.indexOf(target);
        if (index === -1) return;

        const rtl = getComputedStyle(group).direction === "rtl";
        let next: HTMLButtonElement | undefined;
        switch (event.key) {
          case "ArrowRight":
            next = buttons[index + (rtl ? -1 : 1)];
            break;
          case "ArrowLeft":
            next = buttons[index + (rtl ? 1 : -1)];
            break;
          case "Home":
            next = buttons[0];
            break;
          case "End":
            next = buttons.at(-1);
            break;
          default:
            return;
        }
        if (!next || next === target) return;
        event.preventDefault();
        next.focus();
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}
    >
      {children}
    </div>
  );
}
