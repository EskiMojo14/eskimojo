import { createIsomorphicFn } from "@tanstack/react-start";
import { createStore } from "@tanstack/store";

export interface SnackbarOptions {
  message: string;
  /** Milliseconds (4-10 seconds), or null to remain until dismissed. */
  duration?: number | null;
  /** Opt in to a close button for timed messages; persistent messages always show it. */
  showCloseButton?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SnackbarMessage extends SnackbarOptions {
  id: string;
  duration: number | null;
  showCloseButton: boolean;
}

export const snackbarStore = createStore<ReadonlyArray<SnackbarMessage>>([]);

export const showSnackbar = createIsomorphicFn().client(
  (options: string | SnackbarOptions): string => {
    const input = typeof options === "string" ? { message: options } : options;
    const duration = input.duration === undefined ? (input.action ? null : 5000) : input.duration;

    if (!input.message.trim() || (input.action && !input.action.label.trim())) {
      throw new TypeError("Snackbar messages and action labels must not be empty.");
    }
    if (duration !== null && (!Number.isFinite(duration) || duration < 4000 || duration > 10_000)) {
      throw new RangeError("Snackbar duration must be between 4000 and 10000 ms, or null.");
    }

    const id = crypto.randomUUID();
    const message = {
      ...input,
      id,
      duration,
      showCloseButton: duration === null || input.showCloseButton === true,
    };
    snackbarStore.setState((queue) => [...queue, message]);
    return id;
  },
);

export const dismissSnackbar = createIsomorphicFn().client((id: string): void => {
  snackbarStore.setState((queue) => queue.filter((message) => message.id !== id));
});

export const clearSnackbars = createIsomorphicFn().client((): void => {
  snackbarStore.setState(() => []);
});
