import { createRef, useState } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

import { List, ListItem, ListItemContent } from "#/shared/components/list";

import { Radio } from "./index";

function ControlledRadioGroup() {
  const [quality, setQuality] = useState("normal");

  return (
    <>
      <fieldset>
        <legend>Playback quality</legend>
        <Radio
          label="Normal"
          name="quality"
          value="normal"
          checked={quality === "normal"}
          onChange={(event) => setQuality(event.currentTarget.value)}
        />
        <Radio label="High" name="quality" value="high" disabled />
        <Radio
          label="Lossless"
          name="quality"
          value="lossless"
          checked={quality === "lossless"}
          onChange={(event) => setQuality(event.currentTarget.value)}
        />
      </fieldset>
      <button type="button">Continue</button>
    </>
  );
}

test("native groups select exclusively, skip disabled choices, and confirm only changed selections", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<ControlledRadioGroup />);
  const normal = result.getByRole("radio", { name: "Normal" });
  const lossless = result.getByRole("radio", { name: "Lossless" });
  await expect.element(result.getByRole("group", { name: "Playback quality" })).toBeVisible();
  await expect.element(normal).toBeChecked();
  await result.getByText("Lossless").click();
  await expect.element(lossless).toBeChecked();
  await expect.element(normal).not.toBeChecked();
  await lossless.click();
  expect(triggerHaptic).toHaveBeenCalledTimes(1);
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(normal).toBeChecked();
  await expect.element(normal).toHaveFocus();
  await expect.element(lossless).not.toBeChecked();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(lossless).toBeChecked();
  await expect.element(lossless).toHaveFocus();
  await userEvent.keyboard(" ");
  expect(triggerHaptic).toHaveBeenCalledTimes(3);
  expect(triggerHaptic).toHaveBeenCalledWith("selection", undefined);
  await userEvent.tab();
  await expect.element(result.getByRole("button", { name: "Continue" })).toHaveFocus();
});

test("uncontrolled groups keep native form values, reset behavior and forwarded refs", async () => {
  const ref = createRef<HTMLInputElement>();

  const result = await page.renderWithProviders(
    <form>
      <Radio label="MP3" name="format" value="mp3" defaultChecked ref={ref} />
      <Radio label="FLAC" name="format" value="flac" />
      <Radio label="Unavailable" name="unavailable" value="disabled" disabled defaultChecked />
      <button type="reset">Reset format</button>
    </form>,
  );

  const form = result.container.querySelector("form");

  if (!form) throw new Error("Radio form was not rendered.");
  expect(ref.current).toBe(result.getByRole("radio", { name: "MP3" }).element());
  expect(new FormData(form).get("format")).toBe("mp3");
  expect(new FormData(form).has("unavailable")).toBe(false);
  await result.getByRole("radio", { name: "FLAC" }).click();
  expect(new FormData(form).getAll("format")).toEqual(["flac"]);
  await result.getByRole("button", { name: "Reset format" }).click();
  await expect.element(result.getByRole("radio", { name: "MP3" })).toBeChecked();
  await expect.element(result.getByRole("radio", { name: "FLAC" })).not.toBeChecked();
  expect(new FormData(form).get("format")).toBe("mp3");
});

test("required groups expose their description and become valid after a choice", async () => {
  const result = await page.renderWithProviders(
    <fieldset>
      <legend>Delivery (required)</legend>
      <Radio
        label="Email"
        name="delivery"
        value="email"
        required
        aria-describedby="radio-delivery-help"
      />
      <Radio label="Text message" name="delivery" value="sms" required />
      <p id="radio-delivery-help">Choose how to receive your receipt.</p>
    </fieldset>,
  );

  const email = result.getByRole("radio", { name: "Email" });
  await expect.element(email).toBeRequired();
  await expect.element(email).toBeInvalid();
  await expect.element(email).toHaveAccessibleDescription("Choose how to receive your receipt.");
  await result.getByRole("radio", { name: "Text message" }).click();
  await expect.element(email).toBeValid();
});

test("disabled controls, canceled changes and caller-owned feedback remain quiet", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const onChange = vi.fn<() => void>();

  const result = await page.renderWithProviders(
    <>
      <Radio label="Unavailable" name="quiet" value="disabled" disabled onChange={onChange} />
      <Radio label="Custom feedback" name="quiet" value="custom" hapticFeedback={false} />
      <Radio
        label="Canceled feedback"
        name="quiet"
        value="canceled"
        onChange={(event) => event.preventDefault()}
      />
    </>,
  );

  const disabled = result.getByRole("radio", { name: "Unavailable" });
  await expect.element(disabled).toBeDisabled();
  await disabled.click({ force: true });
  await expect.element(disabled).not.toBeChecked();
  expect(onChange).not.toHaveBeenCalled();
  await result.getByRole("radio", { name: "Custom feedback" }).click();
  await expect.element(result.getByRole("radio", { name: "Custom feedback" })).toBeChecked();
  await result.getByRole("radio", { name: "Canceled feedback" }).click();
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("saved haptics opt-out preserves radio selection", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();

  const result = await page.renderWithProviders(<ControlledRadioGroup />, {
    preferences: { haptics: "off" },
  });

  await result.getByRole("radio", { name: "Lossless" }).click();
  await expect.element(result.getByRole("radio", { name: "Lossless" })).toBeChecked();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(result.getByRole("radio", { name: "Normal" })).toBeChecked();
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("leading and trailing list radios select from row edges and whitespace without duplicates", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const onChange = vi.fn<() => void>();

  const result = await page.renderWithProviders(
    <List aria-label="Playback quality" style={{ width: 320 }}>
      <ListItem>
        <label htmlFor="radio-normal">
          <ListItemContent
            headline={<span id="radio-normal-label">Normal</span>}
            leading={
              <Radio
                id="radio-normal"
                aria-labelledby="radio-normal-label"
                name="quality"
                value="normal"
                defaultChecked
                onChange={onChange}
              />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor="radio-high">
          <ListItemContent
            headline="High"
            trailing={
              <Radio id="radio-high" aria-label="High" name="quality" value="high" disabled />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor="radio-lossless">
          <ListItemContent
            headline="Lossless"
            trailing={
              <Radio
                id="radio-lossless"
                aria-label="Lossless"
                name="quality"
                value="lossless"
                onChange={onChange}
              />
            }
          />
        </label>
      </ListItem>
    </List>,
  );

  const normal = result.getByRole("radio", { name: "Normal" });
  const lossless = result.getByRole("radio", { name: "Lossless" });
  const rows = result.getByRole("listitem");
  await rows.nth(2).click({ position: { x: 160, y: 36 } });
  await expect.element(lossless).toBeChecked();
  await rows.nth(2).click({ position: { x: 316, y: 36 } });
  expect(onChange).toHaveBeenCalledTimes(1);
  await rows.nth(0).click({ position: { x: 4, y: 36 } });
  await expect.element(normal).toBeChecked();
  await expect.element(lossless).not.toBeChecked();
  await rows.nth(2).click({ position: { x: 316, y: 36 } });
  await expect.element(lossless).toBeChecked();
  await lossless.click();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(normal).toBeChecked();
  await expect.element(normal).toHaveFocus();
  await userEvent.keyboard(" ");
  expect(onChange).toHaveBeenCalledTimes(4);
  expect(triggerHaptic).toHaveBeenCalledTimes(4);
});
