import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import BEMHelper from "react-bem-helper";

import { useLocalSlice } from "#/utils/use-local-slice";

const dialogBem = BEMHelper("dialog");

interface DialogLabels {
  titleId: string;
  descriptionId?: string;
}

const DialogContentContext = createContext<((labels: DialogLabels | null) => void) | null>(null);

export type DialogClose = (returnValue?: string) => void;

export interface DialogControls {
  close: DialogClose;
  requestClose: DialogClose;
}

function DialogChildren({
  children,
  controls,
}: {
  children: DialogProps["children"];
  controls: DialogControls;
}) {
  return typeof children === "function" ? children(controls) : children;
}

let topLayerExitSupported: boolean | undefined;

function supportsTopLayerExit() {
  if (topLayerExitSupported !== undefined) return topLayerExitSupported;
  if (!CSS.supports("overlay", "auto") || !CSS.supports("transition-behavior", "allow-discrete")) {
    topLayerExitSupported = false;
    return false;
  }

  // Some browsers parse allow-discrete without actually transitioning display.
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.append(probe);
  const initialDisplay = getComputedStyle(probe).display;
  probe.style.display = "none";
  topLayerExitSupported =
    initialDisplay === "block" && getComputedStyle(probe).display === initialDisplay;
  probe.remove();
  return topLayerExitSupported;
}

export interface DialogProps {
  open: boolean;
  onClose?: ComponentProps<"dialog">["onClose"];
  onCancel?: ComponentProps<"dialog">["onCancel"];
  closedby?: ComponentProps<"dialog">["closedby"];
  children: ReactNode | ((controls: DialogControls) => ReactNode);
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

interface DialogLifecycleState {
  exitPhase: "idle" | "closing";
  returnValue: string | undefined;
}

const initialDialogLifecycleState: DialogLifecycleState = {
  exitPhase: "idle",
  returnValue: undefined,
};

const dialogLifecycleSlice = {
  slice: "dialog",
  initialState: initialDialogLifecycleState,
  reducers: {
    exitStarted(state: DialogLifecycleState, action: { payload: string | undefined }) {
      state.exitPhase = "closing";
      state.returnValue = action.payload;
    },
    exitFinished(state: DialogLifecycleState) {
      state.exitPhase = "idle";
      state.returnValue = undefined;
    },
  },
};

function useDialogLifecycle({ open, closedby }: Pick<DialogProps, "open" | "closedby">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<DialogClose | null>(null);
  const requestRef = useRef<{ returnValue?: string } | null>(null);
  const [lifecycle, transition] = useLocalSlice(dialogLifecycleSlice);
  const close = useCallback((returnValue?: string) => closeRef.current?.(returnValue), []);
  const requestClose = useCallback((returnValue?: string) => {
    const dialog = dialogRef.current;
    if (!dialog?.open || dialog.hasAttribute("data-closing")) return;

    requestRef.current = { returnValue };
    try {
      if (typeof dialog.requestClose === "function") {
        dialog.requestClose(returnValue);
      } else if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) {
        closeRef.current?.(returnValue);
      }
    } finally {
      requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const closeDialog: DialogClose = (returnValue) => {
      if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
      if (supportsTopLayerExit()) {
        dialog.close(returnValue);
        return;
      }

      // Mark the DOM synchronously so repeated close requests are ignored before React commits.
      dialog.setAttribute("data-closing", "");
      transition.exitStarted(returnValue);
    };
    const handleBackdropClick = (event: MouseEvent) => {
      if (
        dialog &&
        closedby === "any" &&
        event.target === dialog &&
        !Reflect.has(dialog, "closedBy")
      ) {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          requestClose();
        }
      }
    };

    if (dialog) {
      closeRef.current = closeDialog;
      dialog.addEventListener("click", handleBackdropClick);

      if (open && !dialog.open) {
        dialog.showModal();
      } else if (!open && dialog.open) {
        closeDialog();
      }
    }

    return () => {
      closeRef.current = null;
      if (dialog) {
        dialog.removeEventListener("click", handleBackdropClick);
      }
    };
  }, [open, closedby, requestClose, transition]);

  useEffect(() => {
    if (lifecycle.exitPhase !== "closing") return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    let cancelled = false;
    let finished = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finishClosing = () => {
      if (cancelled || finished) return;
      finished = true;
      clearTimeout(timeout);
      if (dialog.open) dialog.close(lifecycle.returnValue);
      dialog.removeAttribute("data-closing");
      transition.exitFinished();
    };

    timeout = setTimeout(finishClosing, 2000);
    void Promise.allSettled(
      dialog.getAnimations({ subtree: true }).map((animation) => animation.finished),
    ).then(finishClosing);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [lifecycle.exitPhase, lifecycle.returnValue, transition]);

  return {
    close,
    dialogRef,
    exitFinished: transition.exitFinished,
    isClosing: lifecycle.exitPhase === "closing",
    requestClose,
    requestRef,
  };
}

export function Dialog({
  open,
  onClose,
  onCancel,
  closedby = "any",
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: DialogProps) {
  const [labels, setLabels] = useState<DialogLabels | null>(null);
  const { close, dialogRef, exitFinished, isClosing, requestClose, requestRef } =
    useDialogLifecycle({ open, closedby });

  return (
    <dialog
      {...dialogBem({ extra: className })}
      ref={dialogRef}
      data-closing={isClosing ? "" : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : labels?.titleId)}
      aria-describedby={ariaDescribedBy ?? labels?.descriptionId}
      closedby={closedby}
      onClose={(event) => {
        exitFinished();
        onClose?.(event);
      }}
      onCancel={(event) => {
        onCancel?.(event);
        if (event.defaultPrevented) return;
        if (closedby === "none" && !requestRef.current) {
          event.preventDefault();
        } else if (!supportsTopLayerExit()) {
          event.preventDefault();
          close(requestRef.current?.returnValue);
        }
      }}
    >
      <DialogContentContext value={setLabels}>
        <DialogChildren controls={{ close, requestClose }}>{children}</DialogChildren>
      </DialogContentContext>
    </dialog>
  );
}

export interface DialogContentProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DialogContent({
  title,
  description,
  children,
  actions,
  className,
}: DialogContentProps) {
  const titleId = useId();
  const descriptionId = useId();
  const setLabels = useContext(DialogContentContext);
  const hasDescription = description !== undefined && description !== null && description !== false;

  useEffect(() => {
    setLabels?.({ titleId, descriptionId: hasDescription ? descriptionId : undefined });
    return () => setLabels?.(null);
  }, [setLabels, titleId, descriptionId, hasDescription]);

  return (
    <div {...dialogBem({ element: "surface", extra: className })}>
      <header {...dialogBem({ element: "header" })}>
        <h2 {...dialogBem({ element: "title" })} id={titleId}>
          {title}
        </h2>
        {hasDescription && (
          <div {...dialogBem({ element: "description" })} id={descriptionId}>
            {description}
          </div>
        )}
      </header>
      <div {...dialogBem({ element: "body" })}>{children}</div>
      {actions && <footer {...dialogBem({ element: "actions" })}>{actions}</footer>}
    </div>
  );
}
