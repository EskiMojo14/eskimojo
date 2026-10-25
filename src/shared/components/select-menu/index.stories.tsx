import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { SelectMenu, type SelectMenuProps } from "./index";

const options = [
  { value: "system", label: "System", icon: <MdSymbol>routine</MdSymbol> },
  { value: "light", label: "Light", icon: <MdSymbol>light_mode</MdSymbol> },
  { value: "dark", label: "Dark", icon: <MdSymbol>dark_mode</MdSymbol> },
];

function ControlledSelect(props: SelectMenuProps<string>) {
  const [value, setValue] = useState(props.value);
  return (
    <SelectMenu
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

const meta = preview.meta({
  title: "Components/SelectMenu",
  component: SelectMenu,
  args: { label: "Theme", name: "theme", value: "system", options, onChange: fn() },
  render: (args) => <ControlledSelect {...args} />,
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Controlled MD3 outlined select: 56px transparent field, notched floating label, thin outline with primary-color focus emphasis, trailing arrow, and an elevated menu with 48px option targets and a selected checkmark. Options can provide an icon, shown in both the field and menu. Uses the site's color, typography, bevelled shape, and spring tokens. Set --select-menu-label-background to the surrounding surface token when embedding on a non-default surface, such as a dialog. Pass a value present in options and update it through onChange. An optional name adds a hidden form field; disabled prevents interaction and submission. Uses a native auto popover and CSS anchor positioning (required browser capabilities), not base-select, so Firefox and Safari receive the same themed menu rather than an OS picker. The listbox stays inside its owner (including modal dialogs) but renders in the top layer. Focus remains on the combobox with aria-activedescendant. Arrows/Home/End and type-ahead explore without changing the value; Enter/Space, Tab, or blur commit; Escape or clicking the trigger again cancels. Clicking an option selects and restores focus. Clicking outside light-dismisses. Menus flip to fit available space, scroll long lists, respect reduced motion and forced colors, and close when their field is hidden or disabled. Desktop preference toolbars remain separate consumers.",
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    const field = canvas.getByRole("combobox", { name: "Theme" });
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(field);
    await waitFor(() => expect(body.getByRole("listbox", { name: "Theme" })).toBeVisible());
    await expect(body.getByRole("option", { name: "System" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(body.getByRole("option", { name: "Dark" }));
    await expect(field).toHaveTextContent("Dark");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await expect(field).toHaveFocus();
    await expect(args.onChange).toHaveBeenCalledWith("dark");
  },
});

export const Open = meta.story({
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Theme" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("listbox", { name: "Theme" })).toBeVisible());
  },
});

export const Keyboard = meta.story({
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("combobox", { name: "Theme" });
    field.focus();
    await userEvent.keyboard("{ArrowDown}{End}{Escape}");
    await expect(field).toHaveTextContent("System");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("li{Enter}");
    await expect(field).toHaveTextContent("Light");
    await expect(field).toHaveFocus();
  },
});

export const Disabled = meta.story({
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Theme" })).toBeDisabled();
  },
});

export const LongList = meta.story({
  args: {
    label: "Time zone",
    value: "zone-1",
    options: Array.from({ length: 30 }, (_, index) => ({
      value: `zone-${index + 1}`,
      label: `Time zone ${index + 1}`,
    })),
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const field = canvas.getByRole("combobox", { name: "Time zone" });
    await userEvent.click(field);
    await userEvent.keyboard("{End}");
    const option = within(canvasElement.ownerDocument.body).getByRole("option", {
      name: "Time zone 30",
    });
    await expect(field).toHaveAttribute("aria-activedescendant", option.id);
    await userEvent.keyboard("{Enter}");
    await expect(field).toHaveTextContent("Time zone 30");
  },
});
