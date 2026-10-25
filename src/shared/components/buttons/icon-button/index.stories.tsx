import { useState } from "react";
import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { IconButton, type IconButtonVariant } from "./index";

const variants: Array<IconButtonVariant> = ["standard", "filled", "tonal", "outlined"];

const meta = preview.meta({
  title: "Components/Buttons/IconButton",
  component: IconButton,
  args: {
    "aria-label": "More options",
    icon: <MdSymbol>more_vert</MdSymbol>,
  },
  argTypes: {
    variant: { control: "select", options: variants },
    icon: {
      control: false,
      description: "Decorative icon content, typically an MdSymbol or SVG.",
    },
    "aria-pressed": { control: "select", options: [undefined, false, true, "mixed"] },
  },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          'MD3 icon-only button with standard (default), filled, tonal, and outlined variants. It provides a 48px target and 24px icon slot. Give every button an accessible name with aria-label or aria-labelledby; the icon is decorative. Use aria-pressed for a controlled toggle and update it in onClick. The component does not manage pressed state. Native button props and refs are forwarded, and type defaults to "button". Use disabled for native disabling; aria-disabled only communicates state, so callers must suppress actions themselves.',
      },
    },
  },
});

export const Default = meta.story({
  args: { onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "More options" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Variants = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {variants.map((variant) => (
        <IconButton
          key={variant}
          variant={variant}
          aria-label={`${variant} action`}
          icon={<MdSymbol>favorite</MdSymbol>}
        />
      ))}
    </div>
  ),
});

function ToggleIconButton() {
  const [pressed, setPressed] = useState(false);

  return (
    <IconButton
      variant="tonal"
      aria-label="Add to favorites"
      aria-pressed={pressed}
      icon={<MdSymbol>favorite</MdSymbol>}
      onClick={() => setPressed((value) => !value)}
    />
  );
}

export const Toggle = meta.story({
  render: () => <ToggleIconButton />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Add to favorites" });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  },
});

export const Disabled = meta.story({
  args: { disabled: true, onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "More options" });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
});
