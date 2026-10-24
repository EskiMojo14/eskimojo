import BEMHelper from "react-bem-helper";

import preview from "#.storybook/preview";

import { Footer } from "./index";

const appShellBem = BEMHelper("app-shell");

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
