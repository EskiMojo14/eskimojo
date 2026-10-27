import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/tanstack-react";
import addonMsw from "msw-storybook-addon";
import { useGlobals } from "storybook/preview-api";

import "#/shared/styles/index.css";
import "./syntax.css";

import * as v from "valibot";

import {
  ThemeContext,
  ContrastContext,
  PaletteContext,
} from "#/shared/components/prefs/context.ts";
import { Providers } from "#/shared/components/providers.tsx";
import { themeSchema, contrastSchema, paletteSchema } from "#/shared/constants/prefs";

import { theme as storybookTheme } from "./theme";

const globalsSchema = v.object({
  direction: v.fallback(v.picklist(["ltr", "rtl"]), "ltr"),
  palette: paletteSchema,
  theme: themeSchema,
  contrast: contrastSchema,
  motion: v.fallback(v.picklist(["standard", "expressive"]), "expressive"),
});

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
    (Story) => {
      const [globals, updateGlobals] = useGlobals();
      const { direction, palette, theme, contrast, motion } = v.parse(globalsSchema, globals);
      const root = document.documentElement;
      root.dir = direction;
      // Set on <html> so the tokens also reach the body background.
      Object.assign(root.dataset, { theme, contrast, palette, motion });
      return (
        <Providers
          providers={[
            [
              ThemeContext,
              {
                value: {
                  theme,
                  setTheme: (nextTheme) => updateGlobals({ theme: nextTheme }),
                },
              },
            ],
            [
              ContrastContext,
              {
                value: {
                  contrast,
                  setContrast: (nextContrast) => updateGlobals({ contrast: nextContrast }),
                },
              },
            ],
            [
              PaletteContext,
              {
                value: {
                  palette,
                  setPalette: (nextPalette) => updateGlobals({ palette: nextPalette }),
                },
              },
            ],
          ]}
        >
          <Story />
        </Providers>
      );
    },
  ],

  parameters: {
    docs: { theme: storybookTheme },

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

    options: {
      storySort: {
        method: "alphabetical",
        order: ["Welcome", "Foundations", "Components"],
      },
    },
  },
});
