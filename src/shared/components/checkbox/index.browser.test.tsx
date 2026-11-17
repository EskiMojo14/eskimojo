import { createRef, useState } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

import { List, ListItem, ListItemContent } from "#/shared/components/list";

import { Checkbox } from "./index";

function ControlledCheckbox({ initialState = false }: { initialState?: boolean | "mixed" }) {
  const [checked, setChecked] = useState(initialState);
  return (
    <Checkbox
      label="Email updates"
      checked={checked === true}
      indeterminate={checked === "mixed"}
      onChange={(event) => setChecked(event.currentTarget.checked)}
    />
  );
}

test("a named checkbox changes by pointer and keyboard with one haptic per change", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<ControlledCheckbox />);
  const checkbox = result.getByRole("checkbox", { name: "Email updates" });
  await expect.element(checkbox).not.toBeChecked();
  await result.getByText("Email updates").click();
  await expect.element(checkbox).toBeChecked();
  await expect.element(checkbox).toHaveFocus();
  await userEvent.keyboard("{Space>}");
  await expect.element(checkbox).toBeChecked();
  await userEvent.keyboard("{/Space}");
  await expect.element(checkbox).not.toBeChecked();
  expect(triggerHaptic).toHaveBeenCalledTimes(2);
  expect(triggerHaptic).toHaveBeenCalledWith("selection", undefined);
});

test("mixed selection is exposed natively and clears when the user makes a choice", async () => {
  const result = await page.renderWithProviders(<ControlledCheckbox initialState="mixed" />);
  const checkbox = result.getByRole("checkbox", { name: "Email updates" });
  await expect.element(checkbox).toBePartiallyChecked();
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  await expect.element(checkbox).not.toBePartiallyChecked();
  await userEvent.keyboard(" ");
  await expect.element(checkbox).not.toBeChecked();
});

test("uncontrolled checkboxes retain native form submission, reset, validation and refs", async () => {
  const ref = createRef<HTMLInputElement>();
  const result = await page.renderWithProviders(
    <form>
      <Checkbox label="Receive updates" name="updates" value="yes" defaultChecked ref={ref} />
      <Checkbox label="Unavailable" name="unavailable" disabled defaultChecked />
      <Checkbox
        label="Accept the terms (required)"
        name="terms"
        required
        aria-invalid="true"
        aria-describedby="checkbox-terms-error"
      />
      <p id="checkbox-terms-error">Accept the terms to continue.</p>
      <button type="reset">Reset choices</button>
    </form>,
  );
  const checkbox = result.getByRole("checkbox", { name: "Receive updates" });
  const terms = result.getByRole("checkbox", { name: "Accept the terms (required)" });
  const form = result.container.querySelector("form");
  if (!form) throw new Error("Checkbox form was not rendered.");
  expect(ref.current).toBe(checkbox.element());
  expect(new FormData(form).get("updates")).toBe("yes");
  expect(new FormData(form).has("unavailable")).toBe(false);
  await expect.element(terms).toBeRequired();
  await expect.element(terms).toBeInvalid();
  await expect.element(terms).toHaveAccessibleDescription("Accept the terms to continue.");
  await checkbox.click();
  expect(new FormData(form).has("updates")).toBe(false);
  await result.getByRole("button", { name: "Reset choices" }).click();
  await expect.element(checkbox).toBeChecked();
  expect(new FormData(form).get("updates")).toBe("yes");
});

test("disabled controls and feedback opt-outs do not request haptics", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const onChange = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <>
      <Checkbox label="Unavailable" disabled onChange={onChange} />
      <Checkbox label="Custom feedback" hapticFeedback={false} />
      <Checkbox label="Canceled feedback" onChange={(event) => event.preventDefault()} />
    </>,
  );
  await expect.element(result.getByRole("checkbox", { name: "Unavailable" })).toBeDisabled();
  await result.getByRole("checkbox", { name: "Unavailable" }).click({ force: true });
  await expect.element(result.getByRole("checkbox", { name: "Unavailable" })).not.toBeChecked();
  expect(onChange).not.toHaveBeenCalled();
  await result.getByRole("checkbox", { name: "Custom feedback" }).click();
  await expect.element(result.getByRole("checkbox", { name: "Custom feedback" })).toBeChecked();
  await result.getByRole("checkbox", { name: "Canceled feedback" }).click();
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("saved haptics opt-out keeps checkboxes usable", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<ControlledCheckbox />, {
    preferences: { haptics: "off" },
  });
  const checkbox = result.getByRole("checkbox", { name: "Email updates" });
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("leading and trailing list checkboxes keep the whole row clickable without duplicate changes", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const onChange = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <List style={{ width: 320 }}>
      <ListItem>
        <label htmlFor="checkbox-albums">
          <ListItemContent
            headline="Album releases"
            trailing={
              <Checkbox id="checkbox-albums" aria-label="Album releases" onChange={onChange} />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor="checkbox-tours">
          <ListItemContent
            headline="Tour dates"
            leading={<Checkbox id="checkbox-tours" aria-label="Tour dates" />}
          />
        </label>
      </ListItem>
    </List>,
  );
  const row = result.getByRole("listitem").nth(0);
  const checkbox = result.getByRole("checkbox", { name: "Album releases" });
  await row.click({ position: { x: 160, y: 36 } });
  await expect.element(checkbox).toBeChecked();
  await row.click({ position: { x: 4, y: 36 } });
  await expect.element(checkbox).not.toBeChecked();
  await row.click({ position: { x: 316, y: 36 } });
  await expect.element(checkbox).toBeChecked();
  await checkbox.click();
  await expect.element(checkbox).not.toBeChecked();
  await userEvent.keyboard(" ");
  await expect.element(checkbox).toBeChecked();
  expect(onChange).toHaveBeenCalledTimes(5);
  await result.getByText("Tour dates").click();
  await expect.element(result.getByRole("checkbox", { name: "Tour dates" })).toBeChecked();
  expect(triggerHaptic).toHaveBeenCalledTimes(6);
});
