import { getRouteApi } from "@tanstack/react-router";

import { gigBreakdownLabels, gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabNav } from "#/shared/components/tabs";

const gigsRoute = getRouteApi("/gigs/{-$breakdown}/");

export function GigsBreakdownTabs() {
  const { breakdown } = gigsRoute.useParams();
  const selectedIndex = gigBreakdownSchema.options.indexOf(
    breakdown ?? gigBreakdownSchema.fallback,
  );
  return (
    <TabNav aria-label="Gigs breakdown" variant="primary" responsive>
      {gigBreakdownSchema.options.map((value, index) => (
        <TabLink
          key={value}
          to="/gigs/{-$breakdown}"
          params={{
            breakdown: value === "by-month" && breakdown !== "by-month" ? undefined : value,
          }}
          activeOptions={{ exact: true }}
          viewTransition={
            index === selectedIndex
              ? false
              : { types: [index > selectedIndex ? "tab-forward" : "tab-backward"] }
          }
          icon={<MdSymbol>{gigBreakdownLabels[value].icon}</MdSymbol>}
          replace
        >
          {gigBreakdownLabels[value].label}
        </TabLink>
      ))}
    </TabNav>
  );
}
