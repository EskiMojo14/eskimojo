import { trimPathRight, type AnyRouteMatch } from "@tanstack/react-router";

import type { FileRoutesByTo } from "#/routeTree.gen";

type RoutePath = keyof FileRoutesByTo;
type RouteParams<TPath extends RoutePath> = FileRoutesByTo[TPath]["types"]["allParams"];
type RouteSearch<TPath extends RoutePath> = FileRoutesByTo[TPath]["types"]["fullSearchSchema"];

type FilterGroupOptions<
  TPath extends RoutePath,
  TParameter extends keyof RouteSearch<TPath>,
  TValue,
> = {
  route: TPath;
  parameter: TParameter;
  types: (from: TValue, to: TValue) => Array<string>;
};

export function defineTabGroup<
  const TPath extends RoutePath,
  const TParameter extends Extract<keyof RouteParams<NoInfer<TPath>>, string>,
>(group: {
  route: TPath;
  parameter: TParameter;
  order: NoInfer<Array<Extract<RouteParams<TPath>[TParameter], string>>>;
  defaultTab: NoInfer<Extract<RouteParams<TPath>[TParameter], string>>;
}) {
  return group;
}

export function defineDetailGroup<TList extends RoutePath>(group: {
  listRoute: TList;
  detailRoute: Extract<RoutePath, `${NoInfer<TList>}/${string}`>;
  type: string;
}) {
  return group;
}

function isValidatedRouteMatch<TPath extends RoutePath>(
  match: AnyRouteMatch,
  route: TPath,
): match is Omit<AnyRouteMatch, "search"> & { search: RouteSearch<TPath> } {
  return (trimPathRight(match.fullPath) || "/") === route && !match.searchError;
}

export function defineFilterGroup<
  TPath extends RoutePath,
  TParameter extends keyof RouteSearch<NoInfer<TPath>>,
>(
  group: FilterGroupOptions<
    TPath,
    TParameter,
    NonNullable<RouteSearch<NoInfer<TPath>>[NoInfer<TParameter>]>
  > & { defaultValue: NonNullable<RouteSearch<NoInfer<TPath>>[NoInfer<TParameter>]> },
): {
  route: TPath;
  getTypes: (from: AnyRouteMatch, to: AnyRouteMatch) => Array<string> | undefined;
};
export function defineFilterGroup<
  TPath extends RoutePath,
  TParameter extends keyof RouteSearch<NoInfer<TPath>>,
>(
  group: FilterGroupOptions<TPath, TParameter, RouteSearch<NoInfer<TPath>>[NoInfer<TParameter>]> & {
    defaultValue?: undefined;
  },
): {
  route: TPath;
  getTypes: (from: AnyRouteMatch, to: AnyRouteMatch) => Array<string> | undefined;
};
export function defineFilterGroup<
  TPath extends RoutePath,
  TParameter extends keyof RouteSearch<NoInfer<TPath>>,
>({
  route,
  parameter,
  defaultValue,
  types,
}: {
  route: TPath;
  parameter: TParameter;
  defaultValue?: RouteSearch<TPath>[TParameter];
  types(
    this: void,
    from: RouteSearch<TPath>[TParameter],
    to: RouteSearch<TPath>[TParameter],
  ): Array<string>;
}) {
  return {
    route,
    getTypes: (fromMatch: AnyRouteMatch, toMatch: AnyRouteMatch) => {
      if (!isValidatedRouteMatch(fromMatch, route) || !isValidatedRouteMatch(toMatch, route))
        return undefined;
      if (defaultValue !== undefined) {
        const from = fromMatch.search[parameter] ?? defaultValue;
        const to = toMatch.search[parameter] ?? defaultValue;
        return from !== to ? types(from, to) : undefined;
      }
      const from = fromMatch.search[parameter];
      const to = toMatch.search[parameter];
      return from !== to ? types(from, to) : undefined;
    },
  };
}
