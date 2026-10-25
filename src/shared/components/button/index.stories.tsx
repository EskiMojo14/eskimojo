import { useState } from "react";
import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { Button, type ButtonProps, type ButtonVariant } from "./index";

const variants: Array<ButtonVariant> = ["filled", "tonal", "elevated", "outlined", "text"];

const meta = preview.meta({
  title: "Components/Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: { control: "select", options: variants },
    icon: {
      control: false,
      description:
        "Optional decorative leading icon. Accepts MdSymbol or an SVG; the slot defaults to 18px. Keep an accessible text label and do not place interactive controls in the slot.",
    },
    "aria-pressed": { control: "select", options: [undefined, false, true, "mixed"] },
  },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          'MD3 button with filled (default), tonal, elevated, outlined, and text variants. Uses the site’s bevelled shape tokens and a 48px minimum touch target. All native button props and refs are forwarded; type defaults to "button" to avoid accidental form submission. Omit aria-pressed for a normal action; supply it for a controlled toggle and update it in onClick. The component never changes pressed state itself. Keep the toggle label stable so aria-pressed communicates its state. Use disabled for native disabling; aria-disabled only communicates state, so callers must suppress actions themselves. Import the shared stylesheet through the document head, as for other shared components.',
      },
    },
  },
});

export const Default = meta.story({
  args: { onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Variants = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
});

export const WithIcon = meta.story({
  args: { icon: <MdSymbol>edit</MdSymbol>, children: "Edit", onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: /^Edit$/ });
    await expect(button).toHaveAccessibleName("Edit");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

function ToggleButtons(props: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {variants.map((variant) => (
        <Button
          {...props}
          key={variant}
          variant={variant}
          icon={<MdSymbol>favorite</MdSymbol>}
          aria-pressed={pressed}
          onClick={() => setPressed((value) => !value)}
        >
          {variant}
        </Button>
      ))}
    </div>
  );
}

export const Toggle = meta.story({
  render: (args) => <ToggleButtons {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "Shape changes use the fast spatial spring; container, label, border, shadow, and state-layer changes use fast effects springs. The full radius is capped at half the 48px minimum height so the visible corners interpolate immediately rather than staying clamped near 9999px. Switch the Motion toolbar between standard and expressive to compare springs. Reduced motion disables transitions.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /^filled$/ });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
});

export const Disabled = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} disabled aria-pressed>
          {variant}
        </Button>
      ))}
    </div>
  ),
});

export const Mixed = meta.story({
  args: { children: "Bold", variant: "outlined", "aria-pressed": "mixed" },
  parameters: {
    docs: {
      description: {
        story:
          'The native "mixed" value represents a partially selected group. It is forwarded unchanged and uses the unselected surface; the caller decides the next state.',
      },
    },
  },
});
