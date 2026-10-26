import { getRouteApi } from "@tanstack/react-router";

import {
  musicBreakdownLabels,
  musicBreakdownSchema,
} from "#/routes/music.{-$breakdown}/-constants.ts";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

export function MusicBreakdownTabs() {
  const { breakdown } = musicRoute.useParams();
  const selectedIndex = musicBreakdownSchema.options.findIndex(
    (value) => value === (breakdown ?? musicBreakdownSchema.fallback),
  );
  return (
    <TabNav aria-label="Music breakdown" variant="primary" responsive>
      {musicBreakdownSchema.options.map((value, index) => (
        <TabLink
          key={value}
          to="/music/{-$breakdown}"
          params={{
            breakdown:
              value === musicBreakdownSchema.fallback && breakdown !== musicBreakdownSchema.fallback
                ? undefined
                : value,
          }}
          search={(previous) => previous}
          activeOptions={{ exact: true }}
          viewTransition={
            index === selectedIndex
              ? false
              : { types: [index > selectedIndex ? "tab-forward" : "tab-backward"] }
          }
          icon={<MdSymbol>{musicBreakdownLabels[value].icon}</MdSymbol>}
          replace
        >
          {musicBreakdownLabels[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
