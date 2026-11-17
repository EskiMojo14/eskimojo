/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Select-only combobox with a themed cross-browser popover, not a native OS picker. */
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { MdSymbol } from "#/shared/components/symbol";
import { useHapticFeedback } from "#/shared/lib/haptics";
import { useLocalSlice } from "#/utils/use-local-slice";

const selectBem = BEMHelper("select-menu");

export interface SelectMenuOption<Value extends string> {
  value: Value;
  label: string;
  supportingText?: string;
  icon?: ReactNode;
}

export interface SelectMenuProps<Value extends string> {
  label: string;
  value: Value;
  options: ReadonlyArray<SelectMenuOption<Value>>;
  onChange: (value: Value) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
}

function useSelectMenuInteraction<Value extends string>({
  value,
  options,
  onChange,
  disabled = false,
  selectedIndex,
}: Pick<SelectMenuProps<Value>, "value" | "options" | "onChange" | "disabled"> & {
  selectedIndex: number;
}) {
  const { triggerHapticFeedback } = useHapticFeedback();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuState, menuDispatch] = useLocalSlice({
    slice: "select-menu",
    initialState: {
      expanded: false,
      activeIndex: selectedIndex,
      search: { text: "", time: 0 },
    },
    reducers: {
      activeOptionChanged(state, action: { payload: number }) {
        state.activeIndex = action.payload;
      },
      popoverStateChanged(state, action: { payload: { newState: string; selectedIndex: number } }) {
        state.expanded = action.payload.newState === "open";
        if (state.expanded) state.activeIndex = action.payload.selectedIndex;
      },
      typeaheadUpdated(
        state,
        action: { payload: { text: string; time: number; activeIndex: number } },
      ) {
        state.search = { text: action.payload.text, time: action.payload.time };
        state.activeIndex = action.payload.activeIndex;
      },
      typeaheadCleared(state) {
        state.search = { text: "", time: 0 };
      },
    },
  });
  const { activeIndex, expanded } = menuState;

  useEffect(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) return undefined;
    const dismissHidden = () => {
      if (menu.matches(":popover-open") && (disabled || !root.checkVisibility())) {
        menu.hidePopover();
      }
    };
    dismissHidden();
    const observer = new ResizeObserver(dismissHidden);
    observer.observe(root);
    return () => observer.disconnect();
  }, [disabled]);

  useEffect(() => {
    if (expanded) {
      menuRef.current?.children[activeIndex]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [expanded, activeIndex]);

  function showPopover() {
    menuRef.current?.showPopover({ source: triggerRef.current ?? undefined });
  }

  function open(index = selectedIndex) {
    showPopover();
    menuDispatch.activeOptionChanged(index);
  }

  function close() {
    menuRef.current?.hidePopover();
    menuDispatch.typeaheadCleared();
  }

  function commit(index: number) {
    const option = options[index];
    if (option && option.value !== value) {
      onChange(option.value);
      triggerHapticFeedback("selection");
    }
    close();
  }

  function handleTriggerClick() {
    if (menuRef.current?.matches(":popover-open")) close();
    else open();
  }

  function handleTriggerBlur() {
    if (menuRef.current?.matches(":popover-open")) commit(activeIndex);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const isOpen = menuRef.current?.matches(":popover-open");
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        open(isOpen ? Math.min(activeIndex + 1, options.length - 1) : selectedIndex);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey && isOpen) commit(activeIndex);
        else open(isOpen ? Math.max(activeIndex - 1, 0) : selectedIndex);
        break;
      case "Home":
      case "End":
        event.preventDefault();
        open(event.key === "Home" ? 0 : options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen) commit(activeIndex);
        else open();
        break;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case "Tab":
        if (isOpen) commit(activeIndex);
        break;
      default: {
        if (event.altKey || event.key.length !== 1) return;
        event.preventDefault();
        const time = performance.now();
        const text =
          (time - menuState.search.time < 500 ? menuState.search.text : "") +
          event.key.toLowerCase();
        const first = text.charAt(0);
        const query = text === first.repeat(text.length) ? first : text;
        const start = isOpen ? menuState.activeIndex : selectedIndex;
        const match = options.findIndex((_, offset) => {
          const index = (start + offset + (query.length === 1 ? 1 : 0)) % options.length;
          return options[index]?.label.toLowerCase().startsWith(query);
        });
        const index =
          match < 0 ? start : (start + match + (query.length === 1 ? 1 : 0)) % options.length;
        showPopover();
        menuDispatch.typeaheadUpdated({ text, time, activeIndex: index });
      }
    }
  }

  function handleBeforeToggle(newState: string) {
    menuDispatch.popoverStateChanged({ newState, selectedIndex });
  }

  function handleOptionClick(index: number) {
    commit(index);
    triggerRef.current?.focus();
  }

  return {
    activeIndex,
    expanded,
    handleBeforeToggle,
    handleKeyDown,
    handleOptionClick,
    handleTriggerBlur,
    handleTriggerClick,
    menuRef,
    rootRef,
    triggerRef,
  };
}

export function SelectMenu<Value extends string>({
  label,
  value,
  options,
  onChange,
  name,
  disabled = false,
  className,
}: SelectMenuProps<Value>) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const menuId = `${id}-menu`;
  const anchorName = `--select-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const {
    activeIndex,
    expanded,
    handleBeforeToggle,
    handleKeyDown,
    handleOptionClick,
    handleTriggerBlur,
    handleTriggerClick,
    menuRef,
    rootRef,
    triggerRef,
  } = useSelectMenuInteraction({ value, options, onChange, disabled, selectedIndex });

  if (!selected) {
    throw new Error(`SelectMenu "${label}" requires a value present in its options.`);
  }

  return (
    <div {...selectBem({ extra: className })} ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
      <button
        {...selectBem({ element: "trigger" })}
        ref={triggerRef}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={valueId}
        aria-controls={menuId}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-activedescendant={expanded ? `${id}-option-${activeIndex}` : undefined}
        popoverTarget={menuId}
        style={{ anchorName }}
        onClick={(event) => {
          event.preventDefault();
          handleTriggerClick();
        }}
        onBlur={handleTriggerBlur}
        onKeyDown={handleKeyDown}
      >
        {selected.icon && (
          <span {...selectBem({ element: "icon" })} aria-hidden="true">
            {selected.icon}
          </span>
        )}
        <span {...selectBem({ element: "text" })}>
          <span {...selectBem({ element: "label" })} id={labelId}>
            {label}
          </span>
          <span {...selectBem({ element: "value" })} id={valueId}>
            {selected.label}
          </span>
        </span>
        <span {...selectBem({ element: "arrow" })} aria-hidden="true">
          <MdSymbol>arrow_drop_down</MdSymbol>
        </span>
      </button>
      <div
        {...selectBem({ element: "menu" })}
        id={menuId}
        ref={menuRef}
        popover="auto"
        role="listbox"
        aria-labelledby={labelId}
        style={{ positionAnchor: anchorName }}
        onBeforeToggle={(event) => {
          handleBeforeToggle(event.newState);
        }}
        onPointerDown={(event) => event.preventDefault()}
      >
        {options.map((option, index) => (
          <button
            {...selectBem({ element: "option" })}
            key={option.value}
            id={`${id}-option-${index}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={option.value === value}
            data-active={expanded && index === activeIndex}
            onClick={() => handleOptionClick(index)}
          >
            {option.icon && (
              <span {...selectBem({ element: "icon" })} aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span {...selectBem({ element: "option-text" })}>
              <span {...selectBem({ element: "option-label" })}>{option.label}</span>
              {option.supportingText && (
                <span {...selectBem({ element: "option-supporting" })}>
                  {option.supportingText}
                </span>
              )}
            </span>
            {option.value === value && <MdSymbol>check</MdSymbol>}
          </button>
        ))}
      </div>
    </div>
  );
}
