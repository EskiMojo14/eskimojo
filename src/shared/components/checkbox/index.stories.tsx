import { useId, useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { Checkbox } from "./index";

const meta = preview.meta({
  title: "Components/Checkbox",
  component: Checkbox,
  args: { label: "Email updates" },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Material 3 checkbox with an 18x18px box, 2px unchecked outline, 2px corners, 18px icons, 40px state layer, and 48x48px input target. Corners follow the site's beveled shape treatment. The box stays 18x18px while pressed. Uses a native checkbox for keyboard activation, disabled/required states, form submission and reset. Supply label for its own visible label, or omit it and supply aria-label or aria-labelledby when wrapping it in an external native label. See Components/List's Checkbox Rows for leading/trailing whole-row selection with one row ripple and no nested labels. The linter recognizes directly nested Checkbox controls; slotted controls still need htmlFor/id. checked/onChange provides controlled selection; defaultChecked provides native uncontrolled selection. indeterminate sets the native DOM property and exposes mixed selection; callers should clear it when handling a choice. aria-invalid or native user-invalid validation enables error colors; provide visible error text through aria-describedby. Input refs are forwarded. Changes request one preference-aware selection haptic; use hapticFeedback={false} only when the caller owns feedback. Styles use the shared head-linked import chain, reduced-motion spring tokens, and system colors in forced-colors mode.",
      },
    },
  },
});

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

export const Default = meta.story({
  render: () => <ControlledCheckbox />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole("checkbox", { name: "Email updates" });
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByText("Email updates"));
    await expect(checkbox).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
  },
});

export const Checked = meta.story({
  args: { defaultChecked: true },
});

export const Indeterminate = meta.story({
  render: () => <ControlledCheckbox initialState="mixed" />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole("checkbox", { name: "Email updates" });
    await expect(checkbox).toBePartiallyChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(checkbox).not.toBePartiallyChecked();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
  },
});

export const Disabled = meta.story({
  render: () => (
    <div style={{ display: "grid" }}>
      <Checkbox label="Unavailable" disabled />
      <Checkbox label="Already selected" disabled defaultChecked />
      <Checkbox label="Partially selected" disabled indeterminate />
    </div>
  ),
});

function ErrorCheckbox() {
  const [checked, setChecked] = useState(false);
  const errorId = useId();

  return (
    <div>
      <Checkbox
        label="Accept the terms (required)"
        required
        checked={checked}
        onChange={(event) => setChecked(event.currentTarget.checked)}
        aria-invalid={!checked}
        aria-describedby={checked ? undefined : errorId}
      />
      {!checked && <p id={errorId}>Accept the terms to continue.</p>}
    </div>
  );
}

export const Error = meta.story({
  render: () => <ErrorCheckbox />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole("checkbox", { name: "Accept the terms (required)" });
    await expect(checkbox).toBeInvalid();
    await expect(checkbox).toHaveAccessibleDescription("Accept the terms to continue.");
    await userEvent.click(checkbox);
    await expect(checkbox).toBeValid();
    await expect(canvas.queryByText("Accept the terms to continue.")).not.toBeInTheDocument();
  },
});
