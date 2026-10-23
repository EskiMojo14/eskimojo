import preview from "#.storybook/preview";

import { MdSymbol } from "./index";

const meta = preview.meta({
  title: "Components/MdSymbol",
  component: MdSymbol,
  args: {
    children: "favorite",
    fill: false,
    weight: 400,
    size: 24,
    flipRtl: false,
    "aria-label": "",
  },
  argTypes: {
    children: {
      control: false,
      description: "Fixed per story so the production build can extract the symbol name.",
    },
    fill: { control: "boolean" },
    weight: { control: { type: "range", min: 100, max: 700, step: 1 } },
    grade: {
      control: { type: "number", min: -25, max: 200, step: 1 },
      description: "Optional override. Leave unset to use the theme-sensitive grade.",
    },
    opticalSize: {
      control: { type: "number", min: 20, max: 48, step: 1 },
      description: "Optional override. Leave unset to follow the icon size, clamped to 20–48.",
    },
    size: { control: { type: "range", min: 18, max: 72, step: 1 } },
    flipRtl: { control: "boolean" },
    "aria-label": { control: "text" },
  },
});

export const Default = meta.story({
  args: { children: "favorite" },
  render: (args) => <MdSymbol {...args}>favorite</MdSymbol>,
});

export const Filled = meta.story({
  args: { children: "favorite", fill: true, size: 48, "aria-label": "Favourite" },
  render: (args) => <MdSymbol {...args}>favorite</MdSymbol>,
});

export const RightToLeft = meta.story({
  globals: { direction: "rtl" },
  args: { children: "arrow_back", flipRtl: true, "aria-label": "Back" },
  render: (args) => <MdSymbol {...args}>arrow_back</MdSymbol>,
});
