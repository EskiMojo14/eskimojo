import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { expect, onTestFinished, test } from "vite-plus/test";

const exec = promisify(execFile);
const root = new URL("../", import.meta.url);
const themePath = "src/shared/styles/theme";

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "generate-theme-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  await cp(new URL("scripts/", root), join(dir, "scripts"), { recursive: true });
  await mkdir(join(dir, "config"));
  await cp(new URL("config/fmt.config.ts", root), join(dir, "config/fmt.config.ts"));
  await cp(new URL("package.json", root), join(dir, "package.json"));
  await cp(new URL(`${themePath}/exports/`, root), join(dir, themePath, "exports"), {
    recursive: true,
  });
  await mkdir(join(dir, ".storybook"));
  await symlink(fileURLToPath(new URL("node_modules/", root)), join(dir, "node_modules"));
  return {
    dir,
    generate: () => exec(process.execPath, ["scripts/generate-theme.ts"], { cwd: dir }),
  };
}

test("generates a separate palette for every theme and preserves the goat Storybook palette", async () => {
  const { dir, generate } = await fixture();
  // A newly added directory must be discovered without changing the generator.
  await cp(join(dir, themePath, "exports/arctic"), join(dir, themePath, "exports/new-theme"), {
    recursive: true,
  });
  await generate();
  expect(new Set(await readdir(join(dir, themePath, "palettes")))).toEqual(
    new Set(["arctic.gen.css", "goat.gen.css", "new-theme.gen.css"]),
  );

  const outputs = new Map<string, string>();
  for (const theme of ["arctic", "goat", "new-theme"]) {
    const css = await readFile(join(dir, themePath, `palettes/${theme}.gen.css`), "utf8");
    outputs.set(theme, css);
    for (const [level, suffix] of [
      ["standard", ""],
      ["medium", "-mc"],
      ["high", "-hc"],
    ]) {
      const block = new RegExp(`%${theme}-${level} \\{([^}]+)\\}`).exec(css)?.[1];
      expect(block).toBeDefined();
      const light = await readFile(
        join(dir, themePath, `exports/${theme}/light${suffix}.css`),
        "utf8",
      );
      const dark = await readFile(
        join(dir, themePath, `exports/${theme}/dark${suffix}.css`),
        "utf8",
      );
      const darkTokens = new Map(
        [...dark.matchAll(/(--md-sys-color-[\w-]+): ([^;]+);/g)].map(([, name, value]) => [
          name,
          value,
        ]),
      );
      for (const [, name, l] of light.matchAll(/(--md-sys-color-[\w-]+): ([^;]+);/g)) {
        const d = darkTokens.get(name);
        expect(d).toBeDefined();
        expect(block).toContain(`${name}: ${l === d ? l : `light-dark(${l}, ${d})`};`);
      }
      for (const color of ["green", "yellow", "teal"]) {
        for (const role of [color, `on-${color}`, `${color}-container`, `on-${color}-container`]) {
          expect(block).toContain(`--md-sys-color-${role}: light-dark(`);
        }
      }
    }
  }
  expect(outputs.get("arctic")).not.toBe(outputs.get("goat"));
  expect(await readFile(join(dir, ".storybook/palette.gen.ts"), "utf8")).toBe(
    await readFile(new URL(".storybook/palette.gen.ts", root), "utf8"),
  );
  await generate();
  for (const [theme, css] of outputs) {
    expect(await readFile(join(dir, themePath, `palettes/${theme}.gen.css`), "utf8")).toBe(css);
  }
});

test("fails explicitly when a theme export is incomplete", async () => {
  const { dir, generate } = await fixture();
  await rm(join(dir, themePath, "exports/arctic/dark-hc.css"));
  await expect(generate()).rejects.toThrow(/arctic\/dark-hc.css/);
});

test("fails explicitly when an export has no tokens", async () => {
  const { dir, generate } = await fixture();
  await writeFile(join(dir, themePath, "exports/arctic/light.css"), ".light {}");
  await expect(generate()).rejects.toThrow(
    /No --md-sys-color-\* tokens found in exports\/arctic\/light.css/,
  );
});
