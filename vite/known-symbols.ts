import * as gigsCopy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import * as musicCopy from "#/routes/music.{-$breakdown}/-copy.tsx";
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
    gigsCopy.tabs.breakdown,
    musicCopy.tabs.breakdown,
    musicCopy.topTabs.type,
    musicCopy.summary.counts,
    projectsCopy.filters.kind,
  ].flatMap((labels) => Object.values(labels).map(({ icon }) => icon)),
  ...links.flatMap((group) => group.children.map(({ icon }) => icon)),
  ...allProjects.flatMap(({ logo }) => (logo?.symbol ? [logo.symbol] : [])),
] satisfies Array<string>;
