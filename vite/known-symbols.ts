import { gigBreakdownLabels } from "#/routes/gigs.{-$breakdown}/-constants.ts";
import { musicBreakdownLabels, musicTypeLabels } from "#/routes/music.{-$breakdown}/-constants.ts";
import * as projectsCopy from "#/routes/projects/-copy.tsx";
import { links } from "#/shared/components/sidebar/groups";
import {
  contrastLabels,
  densityLabels,
  paletteLabels,
  themeLabels,
} from "#/shared/constants/prefs.ts";

import { allProjects } from "../config/.content-collections/generated/index.js";

/** Names used in interpolated `MdSymbol` children, which cannot be extracted statically. */
export default [
  ...[
    themeLabels,
    contrastLabels,
    densityLabels,
    paletteLabels,
    gigBreakdownLabels,
    musicBreakdownLabels,
    musicTypeLabels,
    projectsCopy.filters.kind,
  ].flatMap((labels) => Object.values(labels).map(({ icon }) => icon)),
  ...links.flatMap((group) => group.children.map(({ icon }) => icon)),
  ...allProjects.flatMap(({ logo }) => (logo?.symbol ? [logo.symbol] : [])),
] satisfies Array<string>;
