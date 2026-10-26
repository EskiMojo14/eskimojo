import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";
import { ExternalLinkButton } from "#/shared/components/buttons/link-button";
import { ExternalLinkIconButton } from "#/shared/components/buttons/link-icon-button";
import { MdSymbol } from "#/shared/components/symbol";

const meta = preview.meta({
  title: "Components/Ripple",
  component: Button,
  beforeEach: async () => {
    await document.fonts.load('24px "Material Symbols Sharp"');
  },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Shared MD3 pressed feedback for buttons, chips, interactive list rows, tabs, and bottom navigation. Visuals follow Material Web: a soft radial-gradient wave starts at 20% of the longest dimension, expands toward the centre over 450ms with standard easing, and fades in over 105ms. Press feedback lasts at least 225ms before a 375ms linear fade-out. Labelled controls start at the pointer; icon controls, bottom-navigation pills, and keyboard presses use unbounded ripples. Hold to retain the pressed layer, then release to fade. These deliberately use fixed ripple timings instead of springs. The decorative layer clips to the control's shape without clipping focus rings or changing layout. Existing hover and focus layers remain. Reduced motion uses a solid static pressed layer. Disabled controls and prevented pointer/key presses do not ripple. Native events, refs, form submission, and link navigation are preserved. Press cancellation, blur, and unmount clean up the effect.",
      },
    },
  },
});

export const Origins = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
      <Button size="large">Press near an edge</Button>
      <IconButton
        size="large"
        variant="tonal"
        aria-label="Unbounded ripple"
        icon={<MdSymbol>favorite</MdSymbol>}
      />
      <ExternalLinkButton href="https://example.com" variant="outlined">
        Pointer-origin link
      </ExternalLinkButton>
      <ExternalLinkIconButton
        href="https://example.com"
        variant="tonal"
        aria-label="Unbounded link"
        icon={<MdSymbol>open_in_new</MdSymbol>}
      />
    </div>
  ),
});

function KeyboardDemo() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Button onClick={() => setCount((value) => value + 1)}>Keyboard action</Button>
      <output aria-label="Activations">{count}</output>
    </div>
  );
}

export const Keyboard = meta.story({
  render: () => <KeyboardDemo />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Keyboard action" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(canvas.getByLabelText("Activations")).toHaveTextContent("2");
  },
});

export const Disabled = meta.story({
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Button disabled>Disabled action</Button>
      <IconButton disabled aria-label="Disabled icon" icon={<MdSymbol>favorite</MdSymbol>} />
      <Button onPointerDown={(event) => event.preventDefault()}>Prevented pointer press</Button>
    </div>
  ),
});
