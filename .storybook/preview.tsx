import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/tanstack-react";
import addonMsw from "msw-storybook-addon";

import "#/shared/styles/index.css";
import "./syntax.css";

import { theme } from "./theme";

function setRootAttribute(
  name: "theme" | "contrast" | "motion" | "palette",
  value: unknown,
  allowed: Array<string>,
) {
  const { dataset } = document.documentElement;
  if (typeof value === "string" && allowed.includes(value)) {
    dataset[name] = value;
  } else {
    delete dataset[name];
  }
}

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonMsw()],

  globalTypes: {
    direction: {
      description: "Text direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
        dynamicTitle: true,
      },
    },
    palette: {
      description: "Color palette",
      toolbar: {
        title: "Palette",
        icon: "paintbrush",
        items: [
          { value: "goat", title: "Goat" },
          { value: "arctic", title: "Arctic" },
        ],
        dynamicTitle: true,
      },
    },
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
    motion: {
      description: "Material 3 spring scheme",
      toolbar: {
        title: "Motion",
        icon: "lightning",
        items: [
          { value: "standard", title: "Standard motion" },
          { value: "expressive", title: "Expressive motion" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    direction: "ltr",
    palette: "goat",
    theme: "system",
    contrast: "system",
    motion: "expressive",
  },

  decorators: [
    (Story, { globals }) => {
      document.documentElement.dir = globals.direction === "rtl" ? "rtl" : "ltr";
      // Set on <html> so the tokens also reach the body background. Without
      // an attribute, the theme follows prefers-color-scheme / prefers-contrast.
      setRootAttribute("theme", globals.theme, ["light", "dark"]);
      setRootAttribute("palette", globals.palette, ["goat", "arctic"]);
      setRootAttribute("contrast", globals.contrast, ["standard", "medium", "high"]);
      setRootAttribute("motion", globals.motion, ["standard", "expressive"]);
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

    layout: "centered",
  },
});
