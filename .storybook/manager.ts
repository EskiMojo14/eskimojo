import { addons } from "storybook/manager-api";

import { theme } from "./theme";

addons.setConfig({
  theme,
  layoutCustomisations: {
    showPanel: ({ storyId }, defaultValue) =>
      storyId === "welcome--welcome" ? false : defaultValue,
  },
});
