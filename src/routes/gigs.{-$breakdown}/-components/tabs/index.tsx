import { getRouteApi } from "@tanstack/react-router";

import { gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const gigsRoute = getRouteApi("/gigs/{-$breakdown}/");

export function GigsBreakdownTabs() {
  const { breakdown } = gigsRoute.useParams();

  return (
    <TabNav aria-label={copy.tabs.title} variant="primary" responsive>
      {gigBreakdownSchema.options.map((value) => (
        <TabLink
          key={value}
          id={`gigs-${value}-tab`}
          panelId={`gigs-${value}-panel`}
          from="/gigs/{-$breakdown}/"
          to="/gigs/{-$breakdown}"
          params={{
            breakdown: value === "by-month" && breakdown !== "by-month" ? undefined : value,
          }}
          search={(search) => search}
          activeOptions={{ exact: true, includeSearch: false }}
          icon={<MdSymbol>{copy.tabs.breakdown[value].icon}</MdSymbol>}
          replace
        >
          {copy.tabs.breakdown[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
