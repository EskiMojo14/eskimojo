import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { AppBar } from "#/shared/components/app-bar";
import {
  showSnackbar,
  snackbarActioned,
  snackbarDismissed,
  snackbarsCleared,
} from "#/shared/lib/snackbar";
import { makeStore } from "#/shared/store";

import { SnackbarHost } from "./index";

function setupTimers() {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
}

test("queues global calls, gives each message its full timeout, and cancels queued messages", async () => {
  setupTimers();
  const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
  store.dispatch(showSnackbar("First update"));
  const cancelled = store.dispatch(showSnackbar("Cancelled update"));
  store.dispatch(showSnackbar("Second update"));
  store.dispatch(snackbarDismissed(cancelled));

  await expect.element(result.getByText("First update", { exact: true })).toBeVisible();
  await vi.advanceTimersByTimeAsync(4999);
  await expect.element(result.getByText("First update", { exact: true })).toBeVisible();
  await vi.advanceTimersByTimeAsync(1);
  await expect.element(result.getByText("Second update", { exact: true })).toBeVisible();
  await vi.advanceTimersByTimeAsync(4999);
  await expect.element(result.getByText("Second update", { exact: true })).toBeVisible();
  await vi.advanceTimersByTimeAsync(1);
  await expect.element(result.getByText("Second update", { exact: true })).not.toBeInTheDocument();
});

test("pauses the remaining timeout on hover and keyboard focus, then restores focus on dismissal", async () => {
  setupTimers();
  const { store, ...result } = await page.renderWithProviders(
    <>
      <button
        onClick={() =>
          store.dispatch(showSnackbar({ message: "Changes saved", showCloseButton: true }))
        }
      >
        Save
      </button>
      <SnackbarHost />
    </>,
  );
  const trigger = result.getByRole("button", { name: "Save", exact: true });
  await trigger.click();
  await expect.element(trigger).toHaveFocus();
  const close = result.getByRole("button", { name: "Dismiss notification" });
  await expect.element(close).toBeVisible();
  await vi.advanceTimersByTimeAsync(2000);
  await close.hover({ force: true });
  await vi.advanceTimersByTimeAsync(10_000);
  await expect.element(close).toBeVisible();
  await trigger.hover();
  await userEvent.tab();
  await expect.element(close).toHaveFocus();
  await vi.advanceTimersByTimeAsync(10_000);
  await expect.element(close).toBeVisible();
  await userEvent.keyboard("{Enter}");
  await expect.element(close).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test("resumes rather than resets the timeout after hovering", async () => {
  setupTimers();
  const { store, ...result } = await page.renderWithProviders(
    <>
      <button>Outside</button>
      <SnackbarHost />
    </>,
  );
  store.dispatch(showSnackbar({ message: "Saved", showCloseButton: true }));
  const close = result.getByRole("button", { name: "Dismiss notification" });
  await expect.element(close).toBeVisible();
  const startedAt = performance.now();
  await vi.advanceTimersByTimeAsync(2000);
  await close.hover();
  // Locator actionability waits advance fake time while the entry spring settles.
  const remaining = 5000 - (performance.now() - startedAt);
  await vi.advanceTimersByTimeAsync(10_000);
  await expect.element(close).toBeVisible();
  await result.getByRole("button", { name: "Outside" }).hover();
  const assertionMargin = 100;
  await vi.advanceTimersByTimeAsync(remaining - assertionMargin);
  await expect.element(close).toBeVisible();
  await vi.advanceTimersByTimeAsync(assertionMargin);
  await expect.element(close).not.toBeInTheDocument();
});

test("keeps action messages until the action is activated and does not light-dismiss", async () => {
  setupTimers();
  const undo = vi.fn<() => void>();
  const { store, ...result } = await page.renderWithProviders(
    <>
      <button>Outside</button>
      <SnackbarHost />
    </>,
  );
  store.dispatch(
    showSnackbar({ message: "Item removed", action: { label: "Undo", onClick: undo } }),
  );
  const action = result.getByRole("button", { name: "Undo" });
  await expect.element(action).toBeVisible();
  await vi.advanceTimersByTimeAsync(60_000);
  await result.getByRole("button", { name: "Outside" }).click();
  await userEvent.keyboard("{Escape}");
  await expect.element(action).toBeVisible();
  await action.click();
  expect(undo).toHaveBeenCalledOnce();
  await expect.element(action).not.toBeInTheDocument();
});

test("clearing an action message unregisters its callback", async () => {
  const undo = vi.fn<() => void>();
  const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
  const id = store.dispatch(
    showSnackbar({ message: "Item removed", action: { label: "Undo", onClick: undo } }),
  );
  await expect.element(result.getByRole("button", { name: "Undo" })).toBeVisible();

  store.dispatch(snackbarsCleared());
  store.dispatch(snackbarActioned(id));

  expect(undo).not.toHaveBeenCalled();
  await expect.element(result.getByRole("button", { name: "Undo" })).not.toBeInTheDocument();
});

test("defers messages and timing while a native modal is open", async () => {
  setupTimers();
  const { store, ...result } = await page.renderWithProviders(
    <>
      <button onClick={() => document.querySelector("dialog")?.showModal()}>Open editor</button>
      <dialog aria-label="Editing">
        <form method="dialog">
          <button>Finish editing</button>
        </form>
      </dialog>
      <SnackbarHost />
    </>,
  );
  await result.getByRole("button", { name: "Open editor" }).click();
  store.dispatch(showSnackbar({ message: "Saved after editing", showCloseButton: true }));
  await vi.advanceTimersByTimeAsync(10_000);
  await expect.element(result.getByText("Saved after editing", { exact: true })).not.toBeVisible();
  await result.getByRole("button", { name: "Finish editing" }).click();
  const close = result.getByRole("button", { name: "Dismiss notification" });
  await expect.element(close).toBeVisible();
  await vi.advanceTimersByTimeAsync(4999);
  await expect.element(close).toBeVisible();
  await vi.advanceTimersByTimeAsync(1);
  await expect.element(close).not.toBeInTheDocument();
});

test("announces visible messages through the live-region fallback and supports clearing the queue", async () => {
  const original = Object.getOwnPropertyDescriptor(document, "ariaNotify");
  Object.defineProperty(document, "ariaNotify", { configurable: true, value: undefined });
  onTestFinished(() => {
    if (original) Object.defineProperty(document, "ariaNotify", original);
    else Reflect.deleteProperty(document, "ariaNotify");
  });
  const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
  store.dispatch(
    showSnackbar({
      message: "Item removed",
      action: { label: "Undo", onClick: vi.fn<() => void>() },
    }),
  );
  await expect
    .element(result.getByRole("status"))
    .toHaveTextContent("Item removed Actions available.");
  store.dispatch(snackbarsCleared());
  await expect.element(result.getByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  await expect.element(result.getByRole("status")).toBeEmptyDOMElement();
});

test("rejects empty messages, empty action labels, and out-of-range durations without queueing", async () => {
  const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
  expect(() => store.dispatch(showSnackbar(" "))).toThrow("must not be empty");
  expect(() =>
    store.dispatch(showSnackbar({ message: "Saved", action: { label: " ", onClick: () => {} } })),
  ).toThrow("must not be empty");
  expect(() => store.dispatch(showSnackbar({ message: "Saved", duration: 3999 }))).toThrow(
    "between 4000 and 10000",
  );
  expect(() => store.dispatch(showSnackbar({ message: "Saved", duration: 10001 }))).toThrow(
    "between 4000 and 10000",
  );
  expect(() => store.dispatch(showSnackbar({ message: "Saved", duration: Number.NaN }))).toThrow(
    "between 4000 and 10000",
  );
  await expect.element(result.getByText("Saved", { exact: true })).not.toBeInTheDocument();
});

test("keeps snackbar text and controls above bottom navigation and returns to the bottom when navigation is hidden", async () => {
  await page.viewport(390, 844);
  onTestFinished(() => page.viewport(1280, 800));
  const { store, ...result } = await page.renderWithProviders(
    <>
      <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
      <SnackbarHost />
    </>,
  );
  store.dispatch(showSnackbar({ message: "Changes saved", duration: null }));
  const navigation = result.getByRole("navigation", { name: "Primary" });
  const close = result.getByRole("button", { name: "Dismiss notification" });
  const text = result.getByText("Changes saved", { exact: true });
  await expect.element(close).toBeVisible();
  await expect
    .poll(() => close.element().getBoundingClientRect().bottom)
    .toBeLessThan(navigation.element().getBoundingClientRect().top);
  await expect
    .poll(() => text.element().getBoundingClientRect().bottom)
    .toBeLessThan(navigation.element().getBoundingClientRect().top);
  await page.viewport(1280, 800);
  await expect.element(navigation).not.toBeInTheDocument();
  await expect.poll(() => close.element().getBoundingClientRect().bottom).toBeGreaterThan(750);
});

test("displays messages queued before hydration without a hydration mismatch", async () => {
  const store = makeStore();
  const container = document.createElement("div");
  document.body.append(container);
  onTestFinished(() => container.remove());
  const app = (
    <Provider store={store}>
      <SnackbarHost />
    </Provider>
  );
  container.innerHTML = renderToString(app);
  store.dispatch(showSnackbar({ message: "Queued before hydration", duration: null }));
  const onRecoverableError = vi.fn<(error: unknown) => void>();
  const root = hydrateRoot(container, app, { onRecoverableError });
  onTestFinished(() => root.unmount());
  await expect.element(page.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
  expect(onRecoverableError).not.toHaveBeenCalled();
});

test.each([undefined, 4000])(
  "timed messages hide the close button and expire with duration=%s",
  async (duration) => {
    setupTimers();
    const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
    store.dispatch(showSnackbar({ message: "Timed update", duration }));
    const message = result.getByText("Timed update", { exact: true });
    await expect.element(message).toBeVisible();
    await expect
      .element(result.getByRole("button", { name: "Dismiss notification" }))
      .not.toBeInTheDocument();
    await vi.advanceTimersByTimeAsync((duration ?? 5000) - 1);
    await expect.element(message).toBeVisible();
    await vi.advanceTimersByTimeAsync(1);
    await expect.element(message).not.toBeInTheDocument();
  },
);

test("persistent messages retain their close button even when callers opt out", async () => {
  const { store, ...result } = await page.renderWithProviders(<SnackbarHost />);
  store.dispatch(
    showSnackbar({ message: "Persistent update", duration: null, showCloseButton: false }),
  );
  const close = result.getByRole("button", { name: "Dismiss notification" });
  await expect.element(close).toBeVisible();
  await close.click();
  await expect
    .element(result.getByText("Persistent update", { exact: true }))
    .not.toBeInTheDocument();
});
