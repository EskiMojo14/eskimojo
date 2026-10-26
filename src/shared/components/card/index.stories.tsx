import preview from "#.storybook/preview";

import { Card, type CardProps } from "./index";

function ExampleCard(props: CardProps) {
  return (
    <Card {...props} style={{ inlineSize: "min(100%, 24rem)", ...props.style }}>
      <h2>Keycaplendar</h2>
      <p>A calendar utility for keeping track of keycap group buys.</p>
      <a href="#source">View source</a>
    </Card>
  );
}

const meta = preview.meta({
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A composable Material Design 3 surface for grouping related content. Choose elevated, filled, or outlined styling; the component renders a neutral div and forwards native div props.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["elevated", "filled", "outlined"] },
  },
});

export const Filled = meta.story({
  args: { variant: "filled" },
  render: (args) => <ExampleCard {...args} />,
});

export const Elevated = meta.story({
  args: { variant: "elevated" },
  render: (args) => <ExampleCard {...args} />,
});

export const Outlined = meta.story({
  args: { variant: "outlined" },
  render: (args) => <ExampleCard {...args} />,
});
