import { useState } from "react";
import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { Switch } from "./index";

function ControlledSwitch() {
  const [checked, setChecked] = useState(false);
  return (
    <Switch
      label="Wi-Fi"
      onIcon={<MdSymbol aria-label="On icon">check</MdSymbol>}
      offIcon={<MdSymbol aria-label="Off icon">close</MdSymbol>}
      checked={checked}
      onChange={(event) => setChecked(event.currentTarget.checked)}
    />
  );
}

test("exposes a named switch that toggles by pointer and keyboard", async () => {
  const result = await page.renderWithProviders(<ControlledSwitch />);
  const toggle = result.getByRole("switch", { name: "Wi-Fi" });

  await expect.element(toggle).not.toBeChecked();
  await expect.element(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect.element(toggle).toBeChecked();
  await expect.element(toggle).toHaveAttribute("aria-checked", "true");
  await userEvent.keyboard(" ");
  await expect.element(toggle).not.toBeChecked();
  await expect.element(toggle).toHaveAccessibleName("Wi-Fi");
});

test("supports uncontrolled form submission and disabled switches", async () => {
  const result = await page.renderWithProviders(
    <form>
      <Switch label="Receive updates" name="updates" value="yes" defaultChecked />
      <Switch label="Unavailable" name="unavailable" disabled defaultChecked />
    </form>,
  );
  const toggle = result.getByRole("switch", { name: "Receive updates" });
  const form = result.container.querySelector("form");
  if (!form) throw new Error("Switch form was not rendered.");

  expect(new FormData(form).get("updates")).toBe("yes");
  expect(new FormData(form).has("unavailable")).toBe(false);
  await expect.element(result.getByRole("switch", { name: "Unavailable" })).toBeDisabled();
  await toggle.click();
  await expect.element(toggle).not.toBeChecked();
  expect(new FormData(form).has("updates")).toBe(false);
});
