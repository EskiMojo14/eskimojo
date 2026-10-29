import { useState } from "react";
import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";
import type { ButtonSize } from "#/shared/components/buttons/button";
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
    size: {
      control: "select",
      options: ["extra-small", "small", "medium", "large", "extra-large"],
      description:
        "MD3 heights: 32, 40, 56, 96, and 136px. Defaults to small (40px). Compact sizes grow to 48px on coarse pointers.",
    },
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
          'MD3 icon-only button with standard (default), filled, tonal, and outlined variants. Defaults to small (40px) with a 24px icon slot; choose extra-small through extra-large to scale the container, icon, and outline width. Compact sizes expand to 48px on coarse pointers. Give every button an accessible name with aria-label or aria-labelledby; the icon is decorative. Use aria-pressed for a controlled toggle and update it in onClick. The component does not manage pressed state. Native button props and refs are forwarded, and type defaults to "button". Use disabled for native disabling; aria-disabled only communicates state, so callers must suppress actions themselves.',
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

export const Sizes = meta.story({
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "start" }}>
      {(["extra-small", "small", "medium", "large", "extra-large"] satisfies Array<ButtonSize>).map(
        (size) => (
          <div key={size} style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {variants.map((variant) => (
              <IconButton
                key={variant}
                size={size}
                variant={variant}
                aria-label={`${size} ${variant} favorite`}
                icon={<MdSymbol>favorite</MdSymbol>}
              />
            ))}
          </div>
        ),
      )}
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
