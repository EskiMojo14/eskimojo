import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

import * as copy from "#/routes/_home/-copy";

import { HomeHero } from "./index";

test("confirms role animation toggles with a selection haptic", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<HomeHero />);
  const pause = result.getByRole("button", { name: copy.hero.controls.pause });

  await pause.click();

  await expect.element(result.getByRole("button", { name: copy.hero.controls.play })).toBeVisible();
  expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
});
