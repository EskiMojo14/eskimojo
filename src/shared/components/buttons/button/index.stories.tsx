import { useState } from "react";
import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./index";

const variants: Array<ButtonVariant> = ["filled", "tonal", "elevated", "outlined", "text"];

const meta = preview.meta({
  title: "Components/Buttons/Button",
  component: Button,
  args: { children: "Save changes", size: "small" },
  argTypes: {
    variant: { control: "select", options: variants },
    size: {
      control: "select",
      options: ["extra-small", "small", "medium", "large", "extra-large"],
      description:
        "MD3 heights: 32, 40, 56, 96, and 136px. Defaults to small (40px). Compact sizes grow to a 48px minimum on coarse pointers.",
    },
    icon: {
      control: false,
      description:
        "Optional decorative leading icon. Accepts MdSymbol or an SVG; the slot defaults to 20px and scales with size. Keep an accessible text label and do not place interactive controls in the slot.",
    },
    "aria-pressed": { control: "select", options: [undefined, false, true, "mixed"] },
  },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          'MD3 button with filled (default), tonal, elevated, outlined, and text variants. Uses the site’s bevelled shape tokens and defaults to small (40px). Sizes range from extra-small to extra-large and scale typography, icons, padding, and outline width. Compact sizes expand to 48px on coarse pointers. All native button props and refs are forwarded; type defaults to "button" to avoid accidental form submission. Omit aria-pressed for a normal action; supply it for a controlled toggle and update it in onClick. The component never changes pressed state itself. Keep the toggle label stable so aria-pressed communicates its state. Use disabled for native disabling; aria-disabled only communicates state, so callers must suppress actions themselves. Import the shared stylesheet through the document head, as for other shared components.',
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

export const Sizes = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "MD3 sizes scale height, padding, icon size, outline width, and typography. Heights are minimums so larger text can grow the control. Omitted size defaults to small. Compact controls expand to at least 48px on coarse pointers.",
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "start" }}>
      {(["extra-small", "small", "medium", "large", "extra-large"] satisfies Array<ButtonSize>).map(
        (size) => (
          <div
            key={size}
            style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}
          >
            <Button size={size}>{size}</Button>
            <Button size={size} variant="outlined" icon={<MdSymbol>edit</MdSymbol>}>
              Edit
            </Button>
            <Button size={size} variant="text">
              Learn more
            </Button>
          </div>
        ),
      )}
    </div>
  ),
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
          "Shape changes use the fast spatial spring; container, label, border, shadow, and state-layer changes use fast effects springs. The full radius is capped at half the chosen minimum height so the visible corners interpolate immediately rather than staying clamped near 9999px. Switch the Motion toolbar between standard and expressive to compare springs. Reduced motion disables transitions.",
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
