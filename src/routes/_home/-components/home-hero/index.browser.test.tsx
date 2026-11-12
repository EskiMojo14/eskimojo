import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { haptics } from "#/shared/lib/haptics";

import { HomeHero } from "./index";

test("confirms role animation toggles with a selection haptic", async () => {
  if (!haptics) throw new Error("Haptics should be initialized in a browser test.");
  using triggerHaptic = vi.spyOn(haptics, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<HomeHero />);
  const pause = result.getByRole("button", { name: "Pause role animation" });

  await pause.click();

  await expect.element(result.getByRole("button", { name: "Resume role animation" })).toBeVisible();
  expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection");
});
