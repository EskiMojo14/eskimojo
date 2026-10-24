import preview from "#.storybook/preview";
import { createBem } from "#/shared/lib/bem";

import { Footer } from "./index";

const appShellBem = createBem("app-shell");

const meta = preview.meta({
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story({
  render: () => (
    <div {...appShellBem()}>
      <div {...appShellBem({ element: "content" })} />
      <Footer />
    </div>
  ),
});
