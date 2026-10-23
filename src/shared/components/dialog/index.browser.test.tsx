import { useState } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Dialog, DialogContent, type DialogProps } from "./index";

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        {({ close }) => (
          <DialogContent
            title="Dialog title"
            description="Dialog description"
            actions={<button onClick={() => close()}>Done</button>}
          >
            <p>Dialog content</p>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

test("opens as a modal, closes through its action, and reopens", async () => {
  const result = await page.renderWithProviders(<DialogHarness />);
  const trigger = result.getByRole("button", { name: "Open dialog" });

  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Dialog title" }).element();
  await expect.element(dialog).toBeVisible();
  expect(dialog.matches(":modal")).toBe(true);
  await expect.element(dialog).toHaveAccessibleDescription("Dialog description");
  await result.getByRole("button", { name: "Done" }).click();
  await expect.element(dialog).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();

  await trigger.click();
  await expect.element(dialog).toBeVisible();
  expect(dialog.matches(":modal")).toBe(true);
});

test("synchronizes native Escape dismissal and restores focus", async () => {
  const result = await page.renderWithProviders(<DialogHarness />);
  const trigger = result.getByRole("button", { name: "Open dialog" });

  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Dialog title" }).element();
  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(dialog).toBeVisible();
});

test("forwards the native close event and form return value", async () => {
  const onClose = vi.fn<(returnValue: string) => void>();
  const result = await page.renderWithProviders(
    <Dialog open onClose={(event) => onClose(event.currentTarget.returnValue)}>
      <DialogContent title="Confirm">
        <form method="dialog">
          <button value="confirm">Confirm</button>
        </form>
      </DialogContent>
    </Dialog>,
  );
  const dialog = result.getByRole("dialog", { name: "Confirm" }).element();

  await result.getByRole("button", { name: "Confirm" }).click();
  await expect.element(dialog).not.toBeVisible();
  expect(onClose).toHaveBeenCalledExactlyOnceWith("confirm");
});

for (const value of ["keep", "discard"]) {
  test(`returns ${value} from an action associated with a dialog form`, async () => {
    const onClose = vi.fn<(returnValue: string) => void>();
    const result = await page.renderWithProviders(
      <Dialog open onClose={(event) => onClose(event.currentTarget.returnValue)}>
        <DialogContent
          title="Choose an action"
          actions={
            <>
              <button type="submit" form="dialog-result" value="keep">
                Keep editing
              </button>
              <button type="submit" form="dialog-result" value="discard">
                Discard
              </button>
            </>
          }
        >
          <form id="dialog-result" method="dialog" />
        </DialogContent>
      </Dialog>,
    );
    const dialog = result.getByRole("dialog", { name: "Choose an action" }).element();

    await result
      .getByRole("button", { name: value === "keep" ? "Keep editing" : "Discard" })
      .click();
    await expect.element(dialog).not.toBeVisible();
    expect(onClose).toHaveBeenCalledExactlyOnceWith(value);
  });
}

test("fires onClose when the open prop becomes false", async () => {
  const onClose = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Dialog open aria-label="Controlled" onClose={onClose}>
      Content
    </Dialog>,
  );
  const dialog = result.getByRole("dialog", { name: "Controlled" }).element();

  await result.rerender(
    <Dialog open={false} aria-label="Controlled" onClose={onClose}>
      Content
    </Dialog>,
  );
  await expect.element(dialog).not.toBeVisible();
  expect(onClose).toHaveBeenCalledExactlyOnceWith(expect.anything());
});

for (const closedby of ["any", "closerequest"] as const) {
  test(`respects closedby=${closedby} for Escape dismissal`, async () => {
    const onClose = vi.fn<() => void>();
    const result = await page.renderWithProviders(
      <Dialog open aria-label="Dismissal policy" closedby={closedby} onClose={onClose}>
        <form method="dialog">
          <button>Close explicitly</button>
        </form>
      </Dialog>,
    );
    const dialog = result.getByRole("dialog", { name: "Dismissal policy" }).element();

    expect(dialog.getAttribute("closedby")).toBe(closedby);
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).not.toBeVisible();
    expect(onClose).toHaveBeenCalledExactlyOnceWith(expect.anything());
  });
}

test("closedby=none requires an explicit close action", async () => {
  const onClose = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Dialog open aria-label="Explicit dismissal" closedby="none" onClose={onClose}>
      <form method="dialog">
        <button>Close explicitly</button>
      </form>
    </Dialog>,
  );
  const dialog = result.getByRole("dialog", { name: "Explicit dismissal" }).element();

  expect(dialog.getAttribute("closedby")).toBe("none");
  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).toBeVisible();
  expect(onClose).not.toHaveBeenCalled();
  await result.getByRole("button", { name: "Close explicitly" }).click();
  await expect.element(dialog).not.toBeVisible();
  expect(onClose).toHaveBeenCalledExactlyOnceWith(expect.anything());
});

for (const returnValue of ["keep", "discard", undefined]) {
  test(`render-prop close forwards return value ${String(returnValue)}`, async () => {
    const onClose = vi.fn<(value: string) => void>();
    const result = await page.renderWithProviders(
      <Dialog open closedby="none" onClose={(event) => onClose(event.currentTarget.returnValue)}>
        {({ close }) => (
          <DialogContent title="Render prop">
            <button onClick={() => close(returnValue)}>Close</button>
          </DialogContent>
        )}
      </Dialog>,
    );
    const dialog = result.getByRole("dialog", { name: "Render prop" }).element();

    await result.getByRole("button", { name: "Close", exact: true }).click();
    await expect.element(dialog).not.toBeVisible();
    expect(onClose).toHaveBeenCalledExactlyOnceWith(returnValue ?? "");
  });
}

test("updates accessible descriptions when content changes", async () => {
  const result = await page.renderWithProviders(
    <Dialog open>
      <DialogContent title="Content" description="Supporting text">
        Body
      </DialogContent>
    </Dialog>,
  );
  const dialog = result.getByRole("dialog", { name: "Content" }).element();
  await expect.element(dialog).toHaveAccessibleDescription("Supporting text");

  await result.rerender(
    <Dialog open>
      <DialogContent title="Updated content">Body</DialogContent>
    </Dialog>,
  );
  await expect.element(dialog).toHaveAccessibleName("Updated content");
  await expect.element(dialog).not.toHaveAttribute("aria-describedby");
});

test("onCancel can prevent requests and Escape, but not definitive close", async () => {
  const onCancel = vi.fn<NonNullable<DialogProps["onCancel"]>>((event) => event.preventDefault());
  const onClose = vi.fn<(value: string) => void>();
  const result = await page.renderWithProviders(
    <Dialog open onCancel={onCancel} onClose={(event) => onClose(event.currentTarget.returnValue)}>
      {({ close, requestClose }) => (
        <DialogContent title="Guarded dialog">
          <button onClick={() => requestClose("cancel")}>Request close</button>
          <button onClick={() => close("confirm")}>Confirm</button>
        </DialogContent>
      )}
    </Dialog>,
  );
  const dialog = result.getByRole("dialog", { name: "Guarded dialog" }).element();

  await result.getByRole("button", { name: "Request close" }).click();
  await expect.element(dialog).toBeVisible();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(dialog).toHaveProperty("returnValue", "");

  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).toBeVisible();
  expect(onCancel).toHaveBeenCalledTimes(2);

  await result.getByRole("button", { name: "Confirm" }).click();
  await expect.element(dialog).not.toBeVisible();
  expect(onCancel).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledExactlyOnceWith("confirm");
});

for (const nativeRequestClose of [true, false]) {
  test(`requestClose returns its value with native support=${nativeRequestClose}`, async () => {
    const events: Array<string> = [];
    const result = await page.renderWithProviders(
      <Dialog
        open
        closedby="none"
        onCancel={() => events.push("cancel")}
        onClose={(event) => events.push(`close:${event.currentTarget.returnValue}`)}
      >
        {({ requestClose }) => (
          <DialogContent title="Requested dismissal">
            <button onClick={() => requestClose("requested")}>Request close</button>
          </DialogContent>
        )}
      </Dialog>,
    );
    const dialog = result.getByRole("dialog", { name: "Requested dismissal" }).element();
    if (!nativeRequestClose) {
      Object.defineProperty(dialog, "requestClose", { value: undefined });
    }

    await result.getByRole("button", { name: "Request close" }).click();
    await expect.element(dialog).not.toBeVisible();
    expect(events).toEqual(["cancel", "close:requested"]);
  });
}
