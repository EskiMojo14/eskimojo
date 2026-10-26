import { getRouteApi } from "@tanstack/react-router";

import { musicBreakdownLabels, musicBreakdownSchema } from "#/routes/music/-constants";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

export function MusicBreakdownTabs() {
  const { breakdown } = musicRoute.useParams();
  return (
    <TabNav aria-label="Music breakdown" variant="primary" responsive>
      {musicBreakdownSchema.options.map((value) => (
        <TabLink
          key={value}
          to="/music/{-$breakdown}"
          params={{
            breakdown: value === "recent" && breakdown !== "recent" ? undefined : value,
          }}
          search={(previous) => previous}
          activeOptions={{ exact: true }}
          icon={<MdSymbol>{musicBreakdownLabels[value].icon}</MdSymbol>}
          replace
        >
          {musicBreakdownLabels[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
