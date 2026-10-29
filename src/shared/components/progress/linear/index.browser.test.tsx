import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { LinearProgress } from "./index";

test("unknown progress becomes measured completion and can return to indeterminate", async () => {
  const result = await page.renderWithProviders(<LinearProgress label="Uploading" />);
  const progress = result.getByRole("progressbar", { name: "Uploading" });
  await expect.element(progress).not.toHaveAttribute("value");
  await result.rerender(<LinearProgress label="Uploading" value={42} max={100} />);
  await expect.element(progress).toHaveAttribute("value", "42");
  await expect.element(progress).toHaveAttribute("max", "100");
  await result.rerender(<LinearProgress label="Uploading" />);
  await expect.element(progress).not.toHaveAttribute("value");
});

test("completion clamps to the native progress range", async () => {
  const result = await page.renderWithProviders(<LinearProgress label="Uploading" value={-1} />);
  await expect.element(result.getByRole("progressbar")).toHaveAttribute("value", "0");
  await result.rerender(<LinearProgress label="Uploading" value={120} max={100} />);
  await expect.element(result.getByRole("progressbar")).toHaveAttribute("value", "100");
});
