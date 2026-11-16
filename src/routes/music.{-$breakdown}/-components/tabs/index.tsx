import { getRouteApi } from "@tanstack/react-router";

import {
  musicBreakdownLabels,
  musicBreakdownSchema,
} from "#/routes/music.{-$breakdown}/-constants.ts";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/{-$type}");

export function MusicBreakdownTabs() {
  const { period } = musicRoute.useSearch();
  return (
    <TabNav aria-label="Music breakdown" variant="primary" responsive>
      {musicBreakdownSchema.options.map((value) =>
        value === "top" ? (
          <TabLink
            key={value}
            id={`music-${value}-tab`}
            panelId={`music-${value}-panel`}
            from={musicRoute.id}
            to="/music/top"
            search={() => ({ period })}
            activeOptions={{ exact: false, includeSearch: false }}
            icon={<MdSymbol>{musicBreakdownLabels[value].icon}</MdSymbol>}
            replace
          >
            {musicBreakdownLabels[value].label}
          </TabLink>
        ) : (
          <TabLink
            key={value}
            id={`music-${value}-tab`}
            panelId={`music-${value}-panel`}
            from={musicRoute.id}
            to="/music/{-$breakdown}/{-$type}"
            params={{ breakdown: value, type: undefined }}
            search={() => ({ period })}
            activeOptions={{ exact: false }}
            icon={<MdSymbol>{musicBreakdownLabels[value].icon}</MdSymbol>}
            replace
          >
            {musicBreakdownLabels[value].label}
          </TabLink>
        ),
      )}
    </TabNav>
  );
}
