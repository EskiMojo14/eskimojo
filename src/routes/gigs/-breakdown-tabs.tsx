import { getRouteApi } from "@tanstack/react-router";

import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

import { gigBreakdownLabels, gigBreakdownSchema } from "./-constants";

const gigsRoute = getRouteApi("/gigs/{-$breakdown}");

export function GigsBreakdownTabs() {
  const { breakdown } = gigsRoute.useParams();
  return (
    <TabNav aria-label="Gigs breakdown" variant="primary" responsive>
      {gigBreakdownSchema.options.map((value) => (
        <TabLink
          key={value}
          to="/gigs/{-$breakdown}"
          params={{
            breakdown: value === "by-month" && breakdown !== "by-month" ? undefined : value,
          }}
          activeOptions={{ exact: true }}
          icon={<MdSymbol>{gigBreakdownLabels[value].icon}</MdSymbol>}
        >
          {gigBreakdownLabels[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
