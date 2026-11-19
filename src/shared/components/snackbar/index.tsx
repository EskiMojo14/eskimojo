import type { UnknownAction, PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { useHydrated } from "@tanstack/react-router";
import { radEventListeners } from "rad-event-listeners";
import { useLayoutEffect, useRef, useState } from "react";
import BEMHelper from "react-bem-helper";

import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";
import { MdSymbol } from "#/shared/components/symbol";
import {
  snackbarActioned,
  snackbarDismissed,
  selectQueuedSnackbar,
  type SnackbarMessage,
} from "#/shared/lib/snackbar";
import type { AppThunk } from "#/shared/store";
import { useAppDispatch, useAppSelector } from "#/shared/store/hooks";

const snackbarBem = BEMHelper("snackbar");

interface Announcement {
  id: string;
  text: string;
}

interface SnackbarLifecycleState {
  previousFocus: unknown;
  visible: boolean;
  hovered: boolean;
  remaining: number | null;
  startedAt: number | null;
}

const initialSnackbarLifecycleState: SnackbarLifecycleState = {
  previousFocus: null,
  visible: false,
  hovered: false,
  remaining: null,
  startedAt: null,
};

const snackbarLifecycleSlice = createSlice({
  name: "snackbarLifecycle",
  initialState: initialSnackbarLifecycleState,
  reducers: {
    visibilityChanged(state, action: PayloadAction<boolean>) {
      state.visible = action.payload;
    },
    pointerEntered(state) {
      state.hovered = true;
    },
    pointerLeft(state) {
      state.hovered = false;
    },
    externalFocusChanged(state, action: PayloadAction<HTMLElement>) {
      state.previousFocus = action.payload;
    },
    timerStarted(state, action: PayloadAction<number>) {
      state.startedAt = action.payload;
    },
    timerPaused(state, action: PayloadAction<number>) {
      if (state.remaining !== null && state.startedAt !== null) {
        state.remaining = Math.max(0, state.remaining - (action.payload - state.startedAt));
      }

      state.startedAt = null;
    },
  },
});

const mountSnackbar =
  (
    surface: HTMLDivElement,
    message: SnackbarMessage,
    announce: (announcement: Announcement | null) => void,
  ): AppThunk<() => void> =>
  (dispatch) => {
    const controller = new AbortController();

    let localState: SnackbarLifecycleState = {
      ...snackbarLifecycleSlice.getInitialState(),
      previousFocus: document.activeElement,
      remaining: message.duration,
    };

    const lifecycleDispatch = (action: UnknownAction) => {
      localState = snackbarLifecycleSlice.reducer(localState, action);
    };

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const pause = () => {
      if (timeout === undefined) return;
      clearTimeout(timeout);
      timeout = undefined;
      lifecycleDispatch(snackbarLifecycleSlice.actions.timerPaused(performance.now()));
    };

    const synchronize = () => {
      if (controller.signal.aborted) return;
      const canShow = !document.hidden && !document.querySelector("dialog:modal");

      if (canShow !== localState.visible) {
        lifecycleDispatch(snackbarLifecycleSlice.actions.visibilityChanged(canShow));

        if (localState.visible) {
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

      if (!localState.visible || localState.hovered || surface.contains(document.activeElement)) {
        pause();
      } else if (localState.remaining !== null && timeout === undefined) {
        const startedAt = performance.now();
        lifecycleDispatch(snackbarLifecycleSlice.actions.timerStarted(startedAt));
        timeout = setTimeout(dispatch, localState.remaining, snackbarDismissed(message.id));
      }
    };

    const pointerEnter = () => {
      lifecycleDispatch(snackbarLifecycleSlice.actions.pointerEntered());
      synchronize();
    };

    const pointerLeave = () => {
      lifecycleDispatch(snackbarLifecycleSlice.actions.pointerLeft());
      synchronize();
    };

    const focusChanged = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && !surface.contains(event.target)) {
        lifecycleDispatch(snackbarLifecycleSlice.actions.externalFocusChanged(event.target));
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
      const { previousFocus } = localState;

      if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  };

function Snackbar({
  message,
  announce,
}: {
  message: SnackbarMessage;
  announce: (announcement: Announcement | null) => void;
}) {
  const dispatch = useAppDispatch();
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;

    return surface ? dispatch(mountSnackbar(surface, message, announce)) : undefined;
  }, [message, announce, dispatch]);

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
                dispatch(snackbarActioned(message.id));
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
              onClick={() => dispatch(snackbarDismissed(message.id))}
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
  const queuedMessage = useAppSelector(selectQueuedSnackbar);
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
