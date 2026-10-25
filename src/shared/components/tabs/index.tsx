import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import BEMHelper from "react-bem-helper";

const tabsBem = BEMHelper("tabs");

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  idFor: (value: string, part: "tab" | "panel") => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab components must be rendered inside Tabs.");
  return context;
}

export type TabsProps = Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  onValueChange?: (value: string) => void;
  variant?: "primary" | "secondary";
  children: ReactNode;
} & ({ value: string; defaultValue?: never } | { defaultValue: string; value?: never });

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = "primary",
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const id = useId().replaceAll(":", "");
  const context: TabsContextValue = {
    value,
    select: (nextValue) => {
      if (nextValue === value) return;
      if (controlledValue === undefined) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    idFor: (tabValue, part) => `tabs-${id}-${encodeURIComponent(tabValue)}-${part}`,
  };

  return (
    <TabsContext value={context}>
      <div {...props} {...tabsBem({ modifier: variant, extra: className })}>
        {children}
      </div>
    </TabsContext>
  );
}

export type TabListProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  orientation?: "horizontal" | "vertical";
} & ({ "aria-label": string } | { "aria-labelledby": string });

function availableTabs(list: HTMLDivElement) {
  return Array.from(list.querySelectorAll<HTMLButtonElement>(":scope > [role='tab']")).filter(
    (tab) =>
      !tab.matches(':disabled, [aria-disabled="true"], [hidden], [inert], [inert] *') &&
      tab.checkVisibility({ visibilityProperty: true }),
  );
}

export function TabList({
  orientation = "horizontal",
  className,
  style,
  onKeyDown,
  ...props
}: TabListProps) {
  const { select } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const anchorId = useId().replaceAll(":", "");

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const originalTabIndexes = new Map<HTMLButtonElement, string | null>();
    const synchronizeTabStops = () => {
      const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>(":scope > [role='tab']"));
      for (const tab of tabs) {
        if (!originalTabIndexes.has(tab)) {
          originalTabIndexes.set(tab, tab.getAttribute("tabindex"));
        }
      }
      const available = availableTabs(list);
      const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
      const tabStop = selected && available.includes(selected) ? selected : available[0];
      for (const tab of tabs) {
        tab.tabIndex = tab === tabStop ? 0 : -1;
      }
    };

    synchronizeTabStops();
    const observer = new MutationObserver(synchronizeTabStops);
    observer.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "hidden", "inert", "aria-selected"],
    });

    return () => {
      observer.disconnect();
      for (const [tab, tabIndex] of originalTabIndexes) {
        if (tabIndex === null) tab.removeAttribute("tabindex");
        else tab.setAttribute("tabindex", tabIndex);
      }
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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

    const list = event.currentTarget;
    const current = event.target;
    if (!(current instanceof HTMLButtonElement) || current.getAttribute("role") !== "tab") return;

    const tabs = availableTabs(list);
    const index = tabs.indexOf(current);
    if (index === -1) return;
    const rtl = getComputedStyle(list).direction === "rtl";
    let next: HTMLButtonElement | undefined;

    switch (event.key) {
      case "ArrowRight":
        if (orientation === "horizontal")
          next = tabs[(index + (rtl ? -1 : 1) + tabs.length) % tabs.length];
        break;
      case "ArrowLeft":
        if (orientation === "horizontal")
          next = tabs[(index + (rtl ? 1 : -1) + tabs.length) % tabs.length];
        break;
      case "ArrowDown":
        if (orientation === "vertical") next = tabs[(index + 1) % tabs.length];
        break;
      case "ArrowUp":
        if (orientation === "vertical") next = tabs[(index - 1 + tabs.length) % tabs.length];
        break;
      case "Home":
        next = tabs[0];
        break;
      case "End":
        next = tabs.at(-1);
        break;
      default:
        return;
    }

    if (!next || next === current) return;
    event.preventDefault();
    next.focus();
    const nextValue = next.dataset.value;
    if (nextValue !== undefined) select(nextValue);
    next.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  return (
    <div
      {...props}
      {...tabsBem({ element: "list", extra: className })}
      role="tablist"
      aria-orientation={orientation}
      tabIndex={-1}
      ref={listRef}
      style={{ ...style, "--tabs-active-label": `--tabs-label-${anchorId}` }}
      onKeyDown={handleKeyDown}
    />
  );
}

export interface TabProps extends Omit<ComponentPropsWithoutRef<"button">, "role" | "value"> {
  value: string;
  icon?: ReactNode;
}

export function Tab({ value, icon, className, children, onClick, ...props }: TabProps) {
  const context = useTabsContext();
  const selected = context.value === value;
  const disabled =
    props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";

  return (
    <button
      {...props}
      {...tabsBem({ element: "tab", extra: className })}
      id={context.idFor(value, "tab")}
      type="button"
      role="tab"
      data-value={value}
      aria-selected={selected}
      aria-controls={context.idFor(value, "panel")}
      tabIndex={selected ? 0 : -1}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) context.select(value);
      }}
    >
      <span {...tabsBem({ element: "content" })}>
        {icon && (
          <span {...tabsBem({ element: "icon" })} aria-hidden="true">
            {icon}
          </span>
        )}
        <span {...tabsBem({ element: "label" })}>{children}</span>
      </span>
    </button>
  );
}

export interface TabPanelProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  value: string;
}

export function TabPanel({ value, className, ...props }: TabPanelProps) {
  const context = useTabsContext();
  const selected = context.value === value;

  return (
    <div
      {...props}
      {...tabsBem({ element: "panel", extra: className })}
      id={context.idFor(value, "panel")}
      role="tabpanel"
      aria-labelledby={context.idFor(value, "tab")}
      hidden={!selected}
      tabIndex={selected ? 0 : undefined}
    />
  );
}
