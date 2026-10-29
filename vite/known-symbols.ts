import { gigBreakdownLabels } from "#/routes/gigs.{-$breakdown}/-constants";
import { musicBreakdownLabels } from "#/routes/music.{-$breakdown}/-constants.ts";
import { projectKindLabels } from "#/routes/projects/-constants.ts";
import { links } from "#/shared/components/sidebar/groups";
import { contrastLabels, paletteLabels, themeLabels } from "#/shared/constants/prefs";

import { allProjects } from "../config/.content-collections/generated/index.js";

/** Names used in interpolated `MdSymbol` children, which cannot be extracted statically. */
export default [
  ...[
    themeLabels,
    contrastLabels,
    paletteLabels,
    gigBreakdownLabels,
    musicBreakdownLabels,
    projectKindLabels,
  ].flatMap((labels) => Object.values(labels).map(({ icon }) => icon)),
  ...links.flatMap((group) => group.children.map(({ icon }) => icon)),
  ...allProjects.flatMap(({ logo }) => (logo?.symbol ? [logo.symbol] : [])),
] satisfies Array<string>;
