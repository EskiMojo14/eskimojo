import { gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import {
  musicBreakdownSchema,
  musicTypeSchema,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-constants";
import { links } from "#/shared/components/sidebar/groups";

import { defineDetailGroup, defineFilterGroup, defineTabGroup } from "./factories";

export const sections = links.flatMap(({ children }) => children.map(({ to }) => to));

export const tabGroups = [
  defineTabGroup({
    route: "/music/{-$breakdown}/{-$type}",
    parameter: "breakdown",
    order: musicBreakdownSchema.options,
    defaultTab: musicBreakdownSchema.fallback,
  }),
  defineTabGroup({
    route: "/music/{-$breakdown}/{-$type}",
    parameter: "type",
    order: musicTypeSchema.options,
    defaultTab: musicTypeSchema.fallback,
    transitionType: "music-type",
  }),
  defineTabGroup({
    route: "/gigs/{-$breakdown}",
    parameter: "breakdown",
    order: gigBreakdownSchema.options,
    defaultTab: gigBreakdownSchema.fallback,
  }),
];

export const detailGroups = [
  defineDetailGroup({ listRoute: "/projects", detailRoute: "/projects/$slug", type: "project" }),
];

export const filterGroups = [
  defineFilterGroup({
    route: "/music/{-$breakdown}/{-$type}",
    parameter: "period",
    defaultValue: periodSchema.fallback,
    types: () => ["music-period"],
  }),
  defineFilterGroup({
    route: "/projects",
    parameter: "type",
    types: (from, to) => (from && to ? [] : ["project-filter", `project-filter-${to ?? "all"}`]),
  }),
];
