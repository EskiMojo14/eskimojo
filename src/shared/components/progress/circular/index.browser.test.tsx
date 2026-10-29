import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { CircularProgress } from "./index";

test("progress switches between unknown and measured completion with a stable accessible name", async () => {
  const result = await page.renderWithProviders(<CircularProgress label="Uploading" />);
  await expect
    .element(result.getByRole("progressbar", { name: "Uploading" }))
    .not.toHaveAttribute("value");
  await result.rerender(<CircularProgress label="Uploading" value={42} max={100} />);
  await expect
    .element(result.getByRole("progressbar", { name: "Uploading" }))
    .toHaveAttribute("value", "42");
  await expect.element(result.getByRole("progressbar")).toHaveAttribute("max", "100");
  await result.rerender(<CircularProgress label="Uploading" />);
  await expect.element(result.getByRole("progressbar")).not.toHaveAttribute("value");
});

test("completion uses the same clamped range as native progress", async () => {
  const result = await page.renderWithProviders(
    <CircularProgress label="Uploading" value={-1} max={100} />,
  );
  await expect.element(result.getByRole("progressbar")).toHaveAttribute("value", "0");
  await result.rerender(<CircularProgress label="Uploading" value={120} max={100} />);
  await expect.element(result.getByRole("progressbar")).toHaveAttribute("value", "100");
});
