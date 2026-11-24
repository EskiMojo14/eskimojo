import { getRouteApi } from "@tanstack/react-router";

import { musicBreakdownSchema } from "#/routes/music.{-$breakdown}/-constants.ts";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/{-$type}");

export function MusicBreakdownTabs() {
  const { period } = musicRoute.useSearch();

  return (
    <TabNav aria-label={copy.tabs.title} variant="primary" responsive>
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
            icon={<MdSymbol>{copy.tabs.breakdown[value].icon}</MdSymbol>}
            replace
          >
            {copy.tabs.breakdown[value].label}
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
            icon={<MdSymbol>{copy.tabs.breakdown[value].icon}</MdSymbol>}
            replace
          >
            {copy.tabs.breakdown[value].label}
          </TabLink>
        ),
      )}
    </TabNav>
  );
}
