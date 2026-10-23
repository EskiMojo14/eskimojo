import { expect, onTestFinished, test } from "vite-plus/test";

const exports = import.meta.glob<string>("./exports/*/*.css", {
  eager: true,
  query: "?raw",
  import: "default",
});

function setup() {
  const root = document.documentElement;
  const attributes = ["data-palette", "data-theme", "data-contrast"];
  const saved = attributes.map((name) => [name, root.getAttribute(name)] as const);
  const probe = document.createElement("div");
  onTestFinished(() => {
    probe.remove();
    for (const [name, value] of saved) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
  });
  for (const name of attributes) root.removeAttribute(name);
  probe.style.backgroundColor = "var(--md-sys-color-primary)";
  document.body.append(probe);
  return { root, probe };
}

function expectedColor(palette: string, scheme: string, level: string) {
  const suffix = level === "medium" ? "-mc" : level === "high" ? "-hc" : "";
  const css = exports[`./exports/${palette}/${scheme}${suffix}.css`];
  const primary = /--md-sys-color-primary: rgb\((\d+) (\d+) (\d+)\);/.exec(css);
  if (!primary) throw new Error(`No primary color for ${palette}/${scheme}${suffix}`);
  return `rgb(${primary[1]}, ${primary[2]}, ${primary[3]})`;
}

for (const palette of ["goat", "arctic"]) {
  for (const scheme of ["light", "dark"]) {
    for (const level of ["system", "standard", "medium", "high"]) {
      test(`${palette} supports ${scheme} with ${level} contrast`, () => {
        const { root, probe } = setup();
        root.dataset.palette = palette;
        root.dataset.theme = scheme;
        if (level !== "system") root.dataset.contrast = level;
        const effectiveLevel =
          level === "system"
            ? matchMedia("(prefers-contrast: more)").matches
              ? "high"
              : "standard"
            : level;
        expect(getComputedStyle(probe).backgroundColor).toBe(
          expectedColor(palette, scheme, effectiveLevel),
        );

        for (const nested of ["standard", "medium", "high"]) {
          probe.dataset.contrast = nested;
          expect(getComputedStyle(probe).backgroundColor).toBe(
            expectedColor(palette, scheme, nested),
          );
        }
      });
    }
  }
}

test("palette can switch at runtime and removing it restores goat", () => {
  const { root, probe } = setup();
  root.dataset.theme = "light";
  root.dataset.contrast = "standard";
  for (const palette of ["goat", "arctic", "goat", "arctic"]) {
    root.dataset.palette = palette;
    expect(getComputedStyle(probe).backgroundColor).toBe(
      expectedColor(palette, "light", "standard"),
    );
  }
  delete root.dataset.palette;
  expect(getComputedStyle(probe).backgroundColor).toBe(expectedColor("goat", "light", "standard"));
});
