import type { AppThunk } from "#/shared/store";
import { addAppListener } from "#/shared/store/listener.ts";
import { createAppSlice } from "#/utils/redux";

export interface SnackbarAction {
  label: string;
}

export interface SnackbarActionWithHandler extends SnackbarAction {
  onClick: () => void;
}

export interface SnackbarOptions<TAction extends SnackbarAction = SnackbarAction> {
  message: string;
  /** Milliseconds (4-10 seconds), or null to remain until dismissed. */
  duration?: number | null;
  /** Opt in to a close button for timed messages; persistent messages always show it. */
  showCloseButton?: boolean;
  action?: TAction;
}

export interface SnackbarMessage<
  TAction extends SnackbarAction = SnackbarAction,
> extends SnackbarOptions<TAction> {
  id: string;
  duration: number | null;
  showCloseButton: boolean;
}

const initialState: ReadonlyArray<SnackbarMessage> = [];

function removeSnackbarById(state: ReadonlyArray<SnackbarMessage>, id: string) {
  return state.filter((message) => message.id !== id);
}

export const snackbarSlice = createAppSlice({
  name: "snackbar",
  initialState,
  reducers: (create) => ({
    snackbarAdded: create.reducer<SnackbarMessage>((state, action) => {
      state.push(action.payload);
    }),
    snackbarActioned: create.reducer<string>((state, action) =>
      removeSnackbarById(state, action.payload),
    ),
    snackbarDismissed: create.reducer<string>((state, action) =>
      removeSnackbarById(state, action.payload),
    ),
    snackbarsCleared: create.reducer(() => initialState),
  }),
  selectors: {
    selectSnackbars: (state) => state,
    selectQueuedSnackbar: (state) => state[0],
  },
});

export const {
  actions: { snackbarAdded, snackbarActioned, snackbarDismissed, snackbarsCleared },
  selectors: { selectSnackbars, selectQueuedSnackbar },
} = snackbarSlice;

export const showSnackbar =
  (options: string | SnackbarOptions<SnackbarActionWithHandler>): AppThunk<string> =>
  (dispatch) => {
    const id = crypto.randomUUID();
    const input = typeof options === "string" ? { message: options } : options;
    const duration = input.duration === undefined ? (input.action ? null : 5000) : input.duration;

    if (!input.message.trim() || (input.action && !input.action.label.trim())) {
      throw new TypeError("Snackbar messages and action labels must not be empty.");
    }
    if (duration !== null && (!Number.isFinite(duration) || duration < 4000 || duration > 10_000)) {
      throw new RangeError("Snackbar duration must be between 4000 and 10000 ms, or null.");
    }

    if (input.action) {
      dispatch(
        addAppListener({
          predicate: (action) =>
            (snackbarActioned.match(action) && action.payload === id) ||
            (snackbarDismissed.match(action) && action.payload === id) ||
            snackbarsCleared.match(action),
          effect: (action, api) => {
            api.unsubscribe();
            if (snackbarActioned.match(action)) input.action?.onClick();
          },
        }),
      );
    }

    const message: SnackbarMessage = {
      ...input,
      id,
      duration,
      showCloseButton: duration === null || input.showCloseButton === true,
      // get rid of onClick, not serializable
      action: input.action ? { label: input.action.label } : undefined,
    };
    dispatch(snackbarAdded(message));
    return id;
  };
