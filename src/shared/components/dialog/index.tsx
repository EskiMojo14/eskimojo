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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<DialogClose | null>(null);
  const requestRef = useRef<{ returnValue?: string } | null>(null);
  const [labels, setLabels] = useState<DialogLabels | null>(null);
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
    let disposed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const closeDialog: DialogClose = (returnValue) => {
      if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
      if (supportsTopLayerExit()) {
        dialog.close(returnValue);
        return;
      }

      dialog.setAttribute("data-closing", "");
      const finishClosing = () => {
        clearTimeout(timeout);
        if (!disposed) {
          dialog.close(returnValue);
          dialog.removeAttribute("data-closing");
        }
      };
      timeout = setTimeout(finishClosing, 2000);
      void Promise.allSettled(
        dialog.getAnimations({ subtree: true }).map((animation) => animation.finished),
      ).then(finishClosing);
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
      disposed = true;
      closeRef.current = null;
      clearTimeout(timeout);
      if (dialog) {
        dialog.removeEventListener("click", handleBackdropClick);
        dialog.removeAttribute("data-closing");
      }
    };
  }, [open, closedby, requestClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`dialog${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : labels?.titleId)}
      aria-describedby={ariaDescribedBy ?? labels?.descriptionId}
      closedby={closedby}
      onClose={onClose}
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
    <div className={`dialog__surface${className ? ` ${className}` : ""}`}>
      <header className="dialog__header">
        <h2 className="dialog__title" id={titleId}>
          {title}
        </h2>
        {hasDescription && (
          <div className="dialog__description" id={descriptionId}>
            {description}
          </div>
        )}
      </header>
      <div className="dialog__body">{children}</div>
      {actions && <footer className="dialog__actions">{actions}</footer>}
    </div>
  );
}
