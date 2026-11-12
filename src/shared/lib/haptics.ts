import { createIsomorphicFn } from "@tanstack/react-start";
import type { MouseEvent } from "react";
import { WebHaptics } from "web-haptics";

export const haptics = createIsomorphicFn().client(() => new WebHaptics())();

export function triggerHapticFeedback(pattern: "light" | "selection" = "selection") {
  if (WebHaptics.isSupported) void haptics?.trigger(pattern);
}

export function triggerSelectionLinkHaptic(
  event: MouseEvent<HTMLAnchorElement>,
  currentHref: string,
) {
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
}
