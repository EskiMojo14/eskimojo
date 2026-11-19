import { useCallback } from "react";
import type { MouseEvent } from "react";
import { useWebHaptics } from "web-haptics/react";

import { useHaptics } from "#/shared/components/prefs/context";

export function useHapticFeedback() {
  const { haptics } = useHaptics();
  const { trigger, isSupported } = useWebHaptics();

  const triggerHapticFeedback = useCallback(
    (pattern: "light" | "selection" = "selection") => {
      if (haptics === "on" && isSupported) void trigger(pattern);
    },
    [haptics, isSupported, trigger],
  );

  return { triggerHapticFeedback, isSupported };
}

export function useSelectionLinkHaptic() {
  const { triggerHapticFeedback } = useHapticFeedback();

  return (event: MouseEvent<HTMLAnchorElement>, currentHref: string) => {
    const link = event.currentTarget;
    const href = link.getAttribute("href");

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      link.getAttribute("aria-disabled") === "true" ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self") ||
      !href ||
      href === currentHref
    ) {
      return;
    }

    triggerHapticFeedback("selection");
  };
}
