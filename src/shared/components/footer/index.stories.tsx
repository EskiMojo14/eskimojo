import preview from "#.storybook/preview";

import { Footer } from "./index";

const meta = preview.meta({
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story({
  render: () => (
    <div className="app-shell">
      <div className="app-shell__content" />
      <Footer />
    </div>
  ),
});
