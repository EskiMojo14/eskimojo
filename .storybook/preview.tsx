import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/tanstack-react";
import "#/shared/styles/index.css";

import { theme } from "./theme";

function setRootAttribute(name: "theme" | "contrast", value: unknown, allowed: string[]) {
  const { dataset } = document.documentElement;
  if (typeof value === "string" && allowed.includes(value)) {
    dataset[name] = value;
  } else {
    delete dataset[name];
  }
}

export default definePreview({
  addons: [addonDocs()],

  globalTypes: {
    theme: {
      description: "Light or dark theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "system", title: "System theme" },
          { value: "light", title: "Light theme", icon: "sun" },
          { value: "dark", title: "Dark theme", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    contrast: {
      description: "Theme contrast level",
      toolbar: {
        title: "Contrast",
        icon: "contrast",
        items: [
          { value: "system", title: "System contrast" },
          { value: "standard", title: "Standard contrast" },
          { value: "medium", title: "Medium contrast" },
          { value: "high", title: "High contrast" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "system", contrast: "system" },

  decorators: [
    (Story, { globals }) => {
      // Set on <html> so the tokens also reach the body background. Without
      // an attribute, the theme follows prefers-color-scheme / prefers-contrast.
      setRootAttribute("theme", globals.theme, ["light", "dark"]);
      setRootAttribute("contrast", globals.contrast, ["standard", "medium", "high"]);
      return <Story />;
    },
  ],

  parameters: {
    docs: { theme },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
});
