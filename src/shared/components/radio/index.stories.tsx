import { useId, useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { Radio } from "./index";

const meta = preview.meta({
  title: "Components/Radio",
  component: Radio,
  args: { label: "Normal", name: "radio-preview", value: "normal" },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Material 3 radio with a 20x20px outer ring, 2px outline, 10x10px selected dot, 40px state layer and 48x48px input target. The ring and dot use the site's approved full-radius bevelled treatment rather than standard MD3 circles; dimensions stay unchanged while pressed. Uses a native radio input: give choices the same name and distinct values for exclusive selection, native arrow-key navigation, disabled-choice skipping and one tab stop per group. Group related choices with fieldset/legend. checked/onChange provides controlled selection; defaultChecked preserves native uncontrolled selection and form reset. Native input props, validation and refs are forwarded. Supply label for the built-in visible label, or omit it and supply aria-label or aria-labelledby inside an external native label. See Components/List's Radio Rows for leading/trailing selection with a whole-row click target and ripple, without nested labels or manual click handlers. Slotted controls need htmlFor/id for the linter. A newly selected choice requests one preference-aware selection haptic; reselecting it stays quiet. Use hapticFeedback={false} only when the caller owns feedback. Styles load through the shared head-linked import chain, use reduced-motion spring tokens and support forced colors.",
      },
    },
  },
});

function RadioGroup() {
  const name = useId();
  const [quality, setQuality] = useState("normal");
  return (
    <fieldset style={{ display: "grid", border: 0, margin: 0, padding: 0 }}>
      <legend>Playback quality</legend>
      <Radio
        label="Normal"
        name={name}
        value="normal"
        checked={quality === "normal"}
        onChange={(event) => setQuality(event.currentTarget.value)}
      />
      <Radio label="High" name={name} value="high" disabled />
      <Radio
        label="Lossless"
        name={name}
        value="lossless"
        checked={quality === "lossless"}
        onChange={(event) => setQuality(event.currentTarget.value)}
      />
    </fieldset>
  );
}

export const Default = meta.story({
  render: () => <RadioGroup />,
  play: async ({ canvas, userEvent }) => {
    const normal = canvas.getByRole("radio", { name: "Normal" });
    const lossless = canvas.getByRole("radio", { name: "Lossless" });
    await expect(normal).toBeChecked();
    await userEvent.click(canvas.getByText("Lossless"));
    await expect(lossless).toBeChecked();
    await expect(normal).not.toBeChecked();
    await userEvent.click(lossless);
    await expect(lossless).toBeChecked();
    await userEvent.keyboard("{ArrowUp}");
    await expect(normal).toBeChecked();
    await expect(normal).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(lossless).toBeChecked();
    await expect(lossless).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(lossless).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "High" })).toBeDisabled();
  },
});

export const Unselected = meta.story({});

export const Selected = meta.story({
  args: { defaultChecked: true },
});

export const Disabled = meta.story({
  render: () => (
    <div style={{ display: "grid" }}>
      <Radio label="Unavailable" name="disabled-preview" value="unselected" disabled />
      <Radio
        label="Already selected"
        name="disabled-preview"
        value="selected"
        disabled
        defaultChecked
      />
    </div>
  ),
});
