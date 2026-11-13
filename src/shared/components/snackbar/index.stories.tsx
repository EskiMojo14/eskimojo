import { expect, fn, waitFor } from "storybook/test";

import preview from "#.storybook/preview";
import { Route as HomeRoute } from "#/routes/_home";
import { AppBar } from "#/shared/components/app-bar";
import { Button } from "#/shared/components/buttons/button";
import { clearSnackbars, showSnackbar } from "#/shared/lib/snackbar";

import { SnackbarHost } from "./index";

const undo = fn();

const meta = preview.meta({
  title: "Components/Snackbar",
  component: SnackbarHost,
  beforeEach: () => {
    clearSnackbars();
    undo.mockClear();
    return clearSnackbars;
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Mount SnackbarHost once in the app shell. Call showSnackbar(message) or showSnackbar({ message, action: { label, onClick }, duration }) from any module; server calls are no-ops. Visible messages are clamped to two lines; the full text remains available to assistive technology. Keep messages concise and provide longer details elsewhere. Plain messages last five seconds; action messages persist. Timed messages hide the close button by default; opt in with showCloseButton: true. Persistent messages always show it. Calls queue rather than stack. Hover, focus, hidden tabs, and modal dialogs pause timing. duration accepts 4000-10000 ms or null. dismissSnackbar(id) removes a message; clearSnackbars() clears all. Keep feedback and actions available elsewhere; callbacks are synchronous and errors belong to the caller.",
      },
    },
  },
});

export const Default = meta.story({
  beforeEach: () => {
    showSnackbar("Changes saved.");
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Changes saved.")).toBeVisible());
    await expect(
      canvas.queryByRole("button", { name: "Dismiss notification" }),
    ).not.toBeInTheDocument();
  },
});

export const TimedWithCloseButton = meta.story({
  render: () => (
    <>
      <Button onClick={() => showSnackbar({ message: "Changes saved.", showCloseButton: true })}>
        Show timed snackbar
      </Button>
      <SnackbarHost />
    </>
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
    <>
      <Button
        onClick={() =>
          showSnackbar({ message: "Item removed.", action: { label: "Undo", onClick: undo } })
        }
      >
        Remove item
      </Button>
      <SnackbarHost />
    </>
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
  beforeEach: () => {
    showSnackbar({
      message:
        "Your changes have been saved. They will be available on your other devices when you reconnect.",
      action: { label: "View saved changes", onClick: fn() },
    });
  },
});

export const Queued = meta.story({
  render: () => (
    <>
      <Button
        onClick={() => {
          showSnackbar({ message: "First update.", duration: null });
          showSnackbar({ message: "Second update.", duration: null });
        }}
      >
        Queue updates
      </Button>
      <SnackbarHost />
    </>
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
    <>
      <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
      <SnackbarHost />
    </>
  ),
  beforeEach: () => {
    showSnackbar({ message: "Changes saved.", duration: null });
  },
});
