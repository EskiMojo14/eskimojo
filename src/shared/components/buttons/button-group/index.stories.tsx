import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/buttons/button";
import { MdSymbol } from "#/shared/components/symbol";

import { ButtonGroup, type ButtonGroupProps } from "./index";

const meta = preview.meta({
  title: "Components/Buttons/ButtonGroup",
  component: ButtonGroup,
  args: { "aria-label": "Document actions" },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "MD3 Expressive button groups: standard has 12px gaps and spring-driven press expansion; connected has 2px gaps, asymmetric end shapes, and full selected corners. Uses the site’s bevelled shape tokens and Button’s 48px minimum touch target. Place Button components directly inside a labelled group. The toolbar has one tab stop: initially the first selected enabled button, otherwise the first enabled button. Left/Right follow reading direction; Home/End jump to the ends; arrows stop at boundaries. Enter/Space activate normally. Focus does not change selection. Callers manage single or multiple selection through each Button’s aria-pressed and onClick; omit aria-pressed for actions. Disabled and hidden buttons are skipped. Do not override child tabIndex or wrap buttons. Narrow groups scroll horizontally instead of wrapping. Shape and width use spatial springs; colours use effects springs; reduced motion is respected.",
      },
    },
  },
});

export const Standard = meta.story({
  args: {
    children: [
      <Button key="save" icon={<MdSymbol>save</MdSymbol>}>
        Save
      </Button>,
      <Button key="copy" variant="tonal" icon={<MdSymbol>content_copy</MdSymbol>}>
        Copy
      </Button>,
      <Button key="share" variant="tonal" icon={<MdSymbol>share</MdSymbol>}>
        Share
      </Button>,
    ],
  },
  play: async ({ canvas, userEvent, globals }) => {
    const save = canvas.getByRole("button", { name: "Save" });
    await userEvent.click(save);
    await userEvent.keyboard(globals.direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Copy" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(canvas.getByRole("button", { name: "Share" })).toHaveFocus();
  },
});

function ThemeButtons(props: ButtonGroupProps) {
  const [theme, setTheme] = useState("system");
  return (
    <ButtonGroup {...props} aria-label="Theme">
      {["system", "light", "dark"].map((value) => (
        <Button
          key={value}
          variant="tonal"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
        >
          {value}
        </Button>
      ))}
    </ButtonGroup>
  );
}

export const Connected = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "Selected buttons use full 24px corners at the default 48px size, including the middle button. Group shape rules override the standalone selected-button shape; unselected inner corners stay small.",
      },
    },
  },
  args: { variant: "connected" },
  render: (args) => <ThemeButtons {...args} />,
  play: async ({ canvas, userEvent, globals }) => {
    await userEvent.click(canvas.getByRole("button", { name: "system" }));
    await userEvent.keyboard(globals.direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    const light = canvas.getByRole("button", { name: "light" });
    await expect(light).toHaveFocus();
    await expect(light).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "system" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
});

function FormattingButtons(props: ButtonGroupProps) {
  const [selected, setSelected] = useState<Array<string>>([]);
  return (
    <ButtonGroup {...props} aria-label="Formatting">
      {["Bold", "Italic", "Underline"].map((value) => (
        <Button
          key={value}
          variant="tonal"
          aria-pressed={selected.includes(value)}
          onClick={() =>
            setSelected((previous) =>
              previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value],
            )
          }
        >
          {value}
        </Button>
      ))}
    </ButtonGroup>
  );
}

export const MultipleSelection = meta.story({
  args: { variant: "connected" },
  render: (args) => <FormattingButtons {...args} />,
  play: async ({ canvas, userEvent }) => {
    for (const name of ["Bold", "Italic"]) {
      const button = canvas.getByRole("button", { name });
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
});

export const Disabled = meta.story({
  args: {
    variant: "connected",
    children: [
      <Button key="back" variant="tonal">
        Back
      </Button>,
      <Button key="save" variant="tonal" disabled>
        Save
      </Button>,
      <Button key="next" variant="tonal">
        Next
      </Button>,
    ],
  },
  play: async ({ canvas, userEvent, globals }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    await userEvent.keyboard(globals.direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Next" })).toHaveFocus();
  },
});
