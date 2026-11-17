import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { Switch } from "./index";

const meta = preview.meta({
  title: "Components/Switch",
  component: Switch,
  args: { label: "Wi-Fi" },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Material 3 switch with a required visible label. Tracks measure 52x32px with a 2px outline. Handles are 16x16px when unselected without an icon, 24x24px when selected or displaying an icon, and 28x28px while pressed; icons remain 16x16px. All handles retain the site's beveled shape. Optional onIcon and offIcon slots accept decorative React nodes; omit both for an iconless switch, or supply either independently. It uses the native checkbox switch attribute with an explicit switch role fallback, retaining checked/defaultChecked, form submission, keyboard interaction, and disabled behavior across browsers. The caller owns controlled state through checked/onChange; the component supports uncontrolled use through defaultChecked. Uses the shared head-linked stylesheet.",
      },
    },
  },
});

function ControlledSwitch({ initialChecked = false }: { initialChecked?: boolean }) {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <Switch
      label="Wi-Fi"
      checked={checked}
      onChange={(event) => setChecked(event.currentTarget.checked)}
    />
  );
}

export const Default = meta.story({
  render: () => <ControlledSwitch />,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Wi-Fi" });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(toggle).not.toBeChecked();
  },
});

export const On = meta.story({
  args: { defaultChecked: true },
});

export const Disabled = meta.story({
  args: { disabled: true, label: "Unavailable" },
});

export const WithIcons = meta.story({
  args: {
    onIcon: <MdSymbol>check</MdSymbol>,
    offIcon: <MdSymbol>close</MdSymbol>,
  },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Wi-Fi" });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(toggle).toHaveAccessibleName("Wi-Fi");
  },
});
