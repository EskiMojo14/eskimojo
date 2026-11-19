import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { Dialog, DialogContent, type DialogProps } from "./index";

test("waits for exit animations before closing when top-layer exit is unsupported", async () => {
  using supports = vi.spyOn(CSS, "supports").mockReturnValue(false);
  const onClose = vi.fn<NonNullable<DialogProps["onClose"]>>();

  const result = await page.renderWithProviders(
    <Dialog open aria-label="Fallback dialog" onClose={onClose}>
      {({ close }) => (
        <DialogContent title="Fallback dialog">
          <button onClick={() => close("done")}>Close</button>
        </DialogContent>
      )}
    </Dialog>,
  );

  const dialogElement = result.getByRole("dialog", { name: "Fallback dialog" }).element();

  if (!(dialogElement instanceof HTMLDialogElement)) {
    throw new Error("Expected a native dialog element.");
  }

  const dialog = dialogElement;
  const exitAnimation = dialog.animate([], { duration: 10_000 });

  await result.getByRole("button", { name: "Close" }).click();
  expect(supports).toHaveBeenCalled();
  expect(dialog.open).toBe(true);
  expect(onClose).not.toHaveBeenCalled();

  exitAnimation.finish();
  await expect.element(dialog).not.toBeVisible();
  expect(onClose).toHaveBeenCalledExactlyOnceWith(expect.anything());
});
