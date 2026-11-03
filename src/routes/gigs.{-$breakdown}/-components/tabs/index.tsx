import { getRouteApi } from "@tanstack/react-router";

import { gigBreakdownLabels, gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const gigsRoute = getRouteApi("/gigs/{-$breakdown}/");

export function GigsBreakdownTabs() {
  const { breakdown } = gigsRoute.useParams();
  return (
    <TabNav aria-label="Gigs breakdown" variant="primary" responsive>
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
          icon={<MdSymbol>{gigBreakdownLabels[value].icon}</MdSymbol>}
          replace
        >
          {gigBreakdownLabels[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
