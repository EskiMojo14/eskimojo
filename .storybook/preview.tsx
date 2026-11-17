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
  HapticsContext,
  SyntaxContext,
} from "#/shared/components/prefs/context.ts";
import { Providers } from "#/shared/components/providers.tsx";
import {
  themeSchema,
  contrastSchema,
  paletteSchema,
  hapticsSchema,
  syntaxSchema,
  syntaxLabels,
} from "#/shared/constants/prefs";

import { theme as storybookTheme } from "./theme";

const globalsSchema = v.object({
  direction: v.fallback(v.picklist(["ltr", "rtl"]), "ltr"),
  palette: paletteSchema,
  theme: themeSchema,
  contrast: contrastSchema,
  haptics: hapticsSchema,
  syntax: syntaxSchema,
  motion: v.fallback(v.picklist(["standard", "expressive"]), "expressive"),
  christmas: v.fallback(v.picklist(["off", "on"]), "off"),
});

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonMsw()],

  beforeEach: async () => {
    await document.fonts.load('24px "Material Symbols Sharp"');
  },

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
          { value: "peach", title: "Peach" },
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
    syntax: {
      description: "Syntax highlighting theme",
      toolbar: {
        title: "Syntax",
        items: syntaxSchema.options.map((value) => ({
          value,
          title: syntaxLabels[value],
        })),
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
    haptics: {
      description: "Haptic feedback",
      toolbar: {
        title: "Haptics",
        icon: "lightning",
        items: [
          { value: "on", title: "Haptics on" },
          { value: "off", title: "Haptics off" },
        ],
        dynamicTitle: true,
      },
    },
    christmas: {
      description: "Christmas artwork",
      toolbar: {
        title: "Christmas",
        icon: "sun",
        items: [
          { value: "off", title: "Christmas off" },
          { value: "on", title: "Christmas on" },
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
    haptics: "on",
    syntax: "dracula-pro",
    christmas: "off",
  },

  decorators: [
    (Story) => {
      const [globals, updateGlobals] = useGlobals();
      const { direction, palette, theme, contrast, motion, christmas, haptics, syntax } = v.parse(
        globalsSchema,
        globals,
      );
      const root = document.documentElement;
      root.dir = direction;
      // Set on <html> so the tokens also reach the body background.
      Object.assign(root.dataset, {
        theme,
        contrast,
        palette,
        syntax,
        motion,
        christmas: christmas === "on" ? "true" : "false",
      });
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
            [
              HapticsContext,
              {
                value: {
                  haptics,
                  setHaptics: (nextHaptics) => updateGlobals({ haptics: nextHaptics }),
                },
              },
            ],
            [
              SyntaxContext,
              {
                value: {
                  syntax,
                  setSyntax: (nextSyntax) => updateGlobals({ syntax: nextSyntax }),
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
