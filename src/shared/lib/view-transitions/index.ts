import { trimPathRight, type AnyRouter, type ParsedLocation } from "@tanstack/react-router";

import { detailGroups, filterGroups, sections, tabGroups } from "./constants";

export function addNavigationTransitions(router: AnyRouter) {
  router.update({
    ...router.options,
    defaultViewTransition: {
      ...(typeof router.options.defaultViewTransition === "object" &&
        router.options.defaultViewTransition),
      types: createNavigationTransitionTypes(router.matchRoutes),
    },
  });
}

export function createNavigationTransitionTypes(matchRoutes: AnyRouter["matchRoutes"]) {
  return function getNavigationTransitionTypes({
    fromLocation,
    toLocation,
  }: {
    fromLocation?: ParsedLocation<Record<string, unknown>>;
    toLocation: ParsedLocation<Record<string, unknown>>;
  }): Array<string> | false {
    if (!fromLocation) return [];
    if (fromLocation.href === toLocation.href) return false;

    const fromMatches = matchRoutes(fromLocation.pathname, fromLocation.search);
    const toMatches = matchRoutes(toLocation.pathname, toLocation.search);
    const fromMatch = fromMatches.at(-1);
    const toMatch = toMatches.at(-1);
    if (
      !fromMatch ||
      !toMatch ||
      [...fromMatches, ...toMatches].some(
        // Router marks unmatched path suffixes on this match flag.
        // oxlint-disable-next-line no-underscore-dangle
        (match) => match._notFound || match.searchError || match.paramsError,
      )
    )
      return [];
    const fromRoute = trimPathRight(fromMatch.fullPath) || "/";
    const toRoute = trimPathRight(toMatch.fullPath) || "/";

    const detailGroup = detailGroups.find(
      ({ listRoute, detailRoute }) =>
        (fromRoute === listRoute && toRoute === detailRoute) ||
        (toRoute === listRoute && fromRoute === detailRoute),
    );
    if (detailGroup) return [detailGroup.type];

    const tabGroup = tabGroups.find(({ route }) => route === fromRoute && route === toRoute);
    if (tabGroup) {
      const { order, parameter, defaultTab } = tabGroup;
      const fromParams: Record<string, unknown> = fromMatch.params;
      const toParams: Record<string, unknown> = toMatch.params;
      const fromTab = fromParams[parameter] ?? defaultTab;
      const toTab = toParams[parameter] ?? defaultTab;
      const fromIndex = order.findIndex((tab) => tab === fromTab);
      const toIndex = order.findIndex((tab) => tab === toTab);
      if (fromIndex !== toIndex) {
        return [toIndex > fromIndex ? "tab-forward" : "tab-backward"];
      }
    }

    for (const { route, getTypes } of filterGroups) {
      if (route !== fromRoute || route !== toRoute) continue;
      const types = getTypes(fromMatch, toMatch);
      if (types !== undefined) return types;
    }
    if (tabGroup && trimPathRight(fromLocation.pathname) !== trimPathRight(toLocation.pathname))
      return false;

    const fromIndex = sections.findIndex(
      (route) =>
        route === fromRoute ||
        detailGroups.some((group) => group.detailRoute === fromRoute && group.listRoute === route),
    );
    const toIndex = sections.findIndex(
      (route) =>
        route === toRoute ||
        detailGroups.some((group) => group.detailRoute === toRoute && group.listRoute === route),
    );
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
      return [toIndex > fromIndex ? "page-forward" : "page-backward"];
    }
    return [];
  };
}
