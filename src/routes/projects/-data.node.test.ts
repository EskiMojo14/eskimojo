import { expect, test } from "vite-plus/test";

import { projectGroupTitles, projectsByKind } from "./-data";

test("separates projects, individual packages, and contributions in display order", () => {
  expect(
    Object.entries(projectGroupTitles).map(([kind, title]) => ({
      title,
      slugs: projectsByKind[kind]?.map(({ slug }) => slug) ?? [],
    })),
  ).toEqual([
    { title: "Projects", slugs: ["schema-benchmarks", "keycaplendar"] },
    { title: "Packages", slugs: ["mix-n-matchers", "history-adapter", "rad-event-listeners"] },
    { title: "Open-source contributions", slugs: ["redux-toolkit", "valibot"] },
  ]);
});
