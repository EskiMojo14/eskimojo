import { expect, test } from "vite-plus/test";

import { projectGroupTitles, projectsByKind } from "./-data";

test("separates projects, individual packages, and contributions in display order", () => {
  expect(
    Object.entries(projectGroupTitles).map(([kind, title]) => ({
      title,
      slugs: projectsByKind[kind]?.map(({ slug }) => slug) ?? [],
    })),
  ).toEqual([
    { title: "Projects", slugs: ["keycaplendar", "schema-benchmarks"] },
    { title: "Packages", slugs: ["history-adapter", "rad-event-listeners", "mix-n-matchers"] },
    { title: "Open-source contributions", slugs: ["redux-toolkit", "valibot"] },
  ]);
});
