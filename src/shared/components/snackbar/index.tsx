import { useHydrated } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { radEventListeners } from "rad-event-listeners";
import { useLayoutEffect, useRef, useState } from "react";
import BEMHelper from "react-bem-helper";

import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";
import { MdSymbol } from "#/shared/components/symbol";
import { dismissSnackbar, snackbarStore, type SnackbarMessage } from "#/shared/lib/snackbar";

const snackbarBem = BEMHelper("snackbar");

interface Announcement {
  id: string;
  text: string;
}

function mountSnackbar(
  surface: HTMLDivElement,
  message: SnackbarMessage,
  announce: (announcement: Announcement | null) => void,
) {
  const controller = new AbortController();
  let previousFocus = document.activeElement;
  let visible = false;
  let hovered = false;
  let remaining = message.duration;
  let startedAt = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const pause = () => {
    if (timeout === undefined) return;
    clearTimeout(timeout);
    timeout = undefined;
    if (remaining !== null) remaining = Math.max(0, remaining - (performance.now() - startedAt));
  };
  const synchronize = () => {
    if (controller.signal.aborted) return;
    const canShow = !document.hidden && !document.querySelector("dialog:modal");
    if (canShow !== visible) {
      visible = canShow;
      if (visible) {
        surface.showPopover();
        const text = `${message.message}${message.action ? " Actions available." : ""}`;
        if (document.ariaNotify) {
          document.ariaNotify(text, { priority: "normal" });
        } else {
          announce({ id: message.id, text });
        }
      } else {
        surface.hidePopover();
        announce(null);
      }
    }

    if (!visible || hovered || surface.contains(document.activeElement)) {
      pause();
    } else if (remaining !== null && timeout === undefined) {
      startedAt = performance.now();
      timeout = setTimeout(() => dismissSnackbar(message.id), remaining);
    }
  };
  const pointerEnter = () => {
    hovered = true;
    synchronize();
  };
  const pointerLeave = () => {
    hovered = false;
    synchronize();
  };
  const focusChanged = (event: FocusEvent) => {
    if (event.target instanceof HTMLElement && !surface.contains(event.target)) {
      previousFocus = event.target;
    }
    synchronize();
  };
  const focusLeft = () => queueMicrotask(synchronize);
  // Native dialogs can be opened by any caller, including outside React.
  const observer = new MutationObserver(synchronize);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  const unsubscribeDocument = radEventListeners(document, {
    visibilitychange: synchronize,
    focus: [focusChanged, { capture: true }],
  });
  const unsubscribeSurface = radEventListeners(surface, {
    pointerenter: pointerEnter,
    pointerleave: pointerLeave,
    blur: [focusLeft, { capture: true }],
  });
  synchronize();

  return () => {
    controller.abort();
    pause();
    observer.disconnect();
    unsubscribeDocument();
    unsubscribeSurface();
    const restoreFocus = surface.contains(document.activeElement);
    surface.hidePopover();
    if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus();
    }
  };
}

function Snackbar({
  message,
  announce,
}: {
  message: SnackbarMessage;
  announce: (announcement: Announcement | null) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    return surface ? mountSnackbar(surface, message, announce) : undefined;
  }, [message, announce]);

  return (
    <div {...snackbarBem()} ref={surfaceRef} popover="manual">
      <span {...snackbarBem({ element: "message" })}>
        <span {...snackbarBem({ element: "text" })}>{message.message}</span>
      </span>
      {(message.action || message.showCloseButton) && (
        <div {...snackbarBem({ element: "controls" })}>
          {message.action && (
            <Button
              variant="text"
              {...snackbarBem({ element: "action" })}
              onClick={() => {
                message.action?.onClick();
                dismissSnackbar(message.id);
              }}
            >
              {message.action.label}
            </Button>
          )}
          {message.showCloseButton && (
            <IconButton
              {...snackbarBem({ element: "close" })}
              aria-label="Dismiss notification"
              icon={<MdSymbol>close</MdSymbol>}
              onClick={() => dismissSnackbar(message.id)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Mount once in the app shell; callers do not need a React provider. */
export function SnackbarHost() {
  const hydrated = useHydrated();
  const queuedMessage = useSelector(snackbarStore, (queue) => queue[0]);
  const message = hydrated ? queuedMessage : undefined;
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  return (
    <section aria-label="Notifications">
      <output {...snackbarBem({ element: "announcement" })} aria-live="polite" aria-atomic="true">
        {message && announcement?.id === message.id && (
          <span key={announcement.id}>{announcement.text}</span>
        )}
      </output>
      {message && <Snackbar key={message.id} message={message} announce={setAnnouncement} />}
    </section>
  );
}
