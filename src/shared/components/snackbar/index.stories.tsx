import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { expect, fn, waitFor } from "storybook/test";

import preview from "#.storybook/preview";
import { Route as HomeRoute } from "#/routes/_home";
import { AppBar } from "#/shared/components/app-bar";
import { Button } from "#/shared/components/buttons/button";
import { showSnackbar, snackbarDismissed } from "#/shared/lib/snackbar";
import { makeStore } from "#/shared/store";
import { useAppDispatch } from "#/shared/store/hooks";

import { SnackbarHost } from "./index";

const undo = fn();
const defaultMessage = "Changes saved.";

const longMessage = {
  message:
    "Your changes have been saved. They will be available on your other devices when you reconnect.",
  action: { label: "View saved changes", onClick: fn() },
};

const persistentMessage = { message: "Changes saved.", duration: null };

function SnackbarStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}

function SnackbarDemo({
  initialMessage,
  children,
}: {
  initialMessage?: Parameters<typeof showSnackbar>[0];
  children?: ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (initialMessage === undefined) return undefined;
    const id = dispatch(showSnackbar(initialMessage));

    return () => {
      dispatch(snackbarDismissed(id));
    };
  }, [dispatch, initialMessage]);

  return (
    <>
      {children}
      <SnackbarHost />
    </>
  );
}

function TimedSnackbarButton() {
  const dispatch = useAppDispatch();

  return (
    <Button
      onClick={() => dispatch(showSnackbar({ message: defaultMessage, showCloseButton: true }))}
    >
      Show timed snackbar
    </Button>
  );
}

function RemoveItemButton() {
  const dispatch = useAppDispatch();

  return (
    <Button
      onClick={() =>
        dispatch(
          showSnackbar({ message: "Item removed.", action: { label: "Undo", onClick: undo } }),
        )
      }
    >
      Remove item
    </Button>
  );
}

function QueueUpdatesButton() {
  const dispatch = useAppDispatch();

  return (
    <Button
      onClick={() => {
        dispatch(showSnackbar({ message: "First update.", duration: null }));
        dispatch(showSnackbar({ message: "Second update.", duration: null }));
      }}
    >
      Queue updates
    </Button>
  );
}

const meta = preview.meta({
  title: "Components/Snackbar",
  component: SnackbarHost,
  decorators: [
    (Story, context) => (
      <SnackbarStoreProvider key={context.id}>
        <Story />
      </SnackbarStoreProvider>
    ),
  ],
  beforeEach: () => {
    undo.mockClear();
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Mount SnackbarHost once in the app shell. Dispatch showSnackbar(message) or showSnackbar({ message, action: { label, onClick }, duration }) from the router-scoped Redux store. Visible messages are clamped to two lines; the full text remains available to assistive technology. Keep messages concise and provide longer details elsewhere. Plain messages last five seconds; action messages persist. Timed messages hide the close button by default; opt in with showCloseButton: true. Persistent messages always show it. Calls queue rather than stack. Hover, focus, hidden tabs, and modal dialogs pause timing. duration accepts 4000-10000 ms or null. Dismiss and clear messages by dispatching the matching snackbar actions. Keep feedback and actions available elsewhere; callbacks are synchronous and errors belong to the caller.",
      },
    },
  },
});

export const Default = meta.story({
  render: () => <SnackbarDemo initialMessage={defaultMessage} />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Changes saved.")).toBeVisible());
    await expect(
      canvas.queryByRole("button", { name: "Dismiss notification" }),
    ).not.toBeInTheDocument();
  },
});

export const TimedWithCloseButton = meta.story({
  render: () => (
    <SnackbarDemo>
      <TimedSnackbarButton />
    </SnackbarDemo>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show timed snackbar" }));
    await waitFor(() => expect(canvas.getByText("Changes saved.")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(canvas.queryByText("Changes saved.")).not.toBeInTheDocument());
  },
});

export const WithAction = meta.story({
  render: () => (
    <SnackbarDemo>
      <RemoveItemButton />
    </SnackbarDemo>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Remove item" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveFocus();
    await userEvent.tab();
    const action = canvas.getByRole("button", { name: "Undo" });
    await expect(action).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(undo).toHaveBeenCalledOnce();
    await waitFor(() => expect(canvas.queryByText("Item removed.")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
});

export const LongMessage = meta.story({
  render: () => <SnackbarDemo initialMessage={longMessage} />,
});

export const Queued = meta.story({
  render: () => (
    <SnackbarDemo>
      <QueueUpdatesButton />
    </SnackbarDemo>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Queue updates" }));
    await waitFor(() => expect(canvas.getByText("First update.")).toBeVisible());
    await expect(canvas.queryByText("Second update.")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(canvas.getByText("Second update.")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(canvas.queryByText("Second update.")).not.toBeInTheDocument());
  },
});

export const AboveBottomNavigation = meta.story({
  parameters: {
    tanstack: { router: { route: HomeRoute } },
    viewport: {
      options: {
        snackbarMobile: {
          name: "Snackbar above navigation",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
    docs: {
      description: {
        story:
          "The snackbar anchors above the actual bottom navigation, including its safe-area padding. Without bottom navigation it returns to the viewport edge.",
      },
    },
  },
  globals: { viewport: { value: "snackbarMobile", isRotated: false } },
  render: () => (
    <SnackbarDemo initialMessage={persistentMessage}>
      <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
    </SnackbarDemo>
  ),
});
