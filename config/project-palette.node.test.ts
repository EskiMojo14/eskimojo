import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";

import { argbFromHex, Contrast, Hct } from "@material/material-color-utilities";
import sharp from "sharp";
import { expect, onTestFinished, test } from "vite-plus/test";

import { generateProjectPalette } from "./project-palette";

function schemes(value: string | undefined) {
  const match = /^light-dark\((#[\da-f]{6}), (#[\da-f]{6})\)$/.exec(value ?? "");
  if (!match?.[1] || !match[2]) throw new Error(`Invalid card palette value: ${value}`);
  return [match[1], match[2]].map((hex) => Hct.fromInt(argbFromHex(hex)));
}

test.each([
  { light: "/projects/redux.png" },
  { light: "/projects/neocities-light.svg", dark: "/projects/neocities-dark.svg" },
  { light: "/Goat-avatar.webp" },
])("generates readable card and detail colors for $light", async (logo) => {
  const palette = await generateProjectPalette(logo);
  for (const [level, target] of [
    ["standard", 4.5],
    ["medium", 6],
    ["high", 7],
  ] as const) {
    for (const surface of [
      "surface",
      "surface-container-low",
      "surface-container-high",
      "surface-container-highest",
    ]) {
      const backgrounds = schemes(palette[`--project-${level}-${surface}`]);
      for (const role of [
        "primary",
        "secondary",
        "tertiary",
        "error",
        "on-surface",
        "on-surface-variant",
      ]) {
        const foregrounds = schemes(palette[`--project-${level}-${role}`]);
        foregrounds.forEach((foreground, index) => {
          const background = backgrounds[index];
          if (!background) throw new Error("Missing project background");
          expect(Contrast.ratioOfTones(foreground.tone, background.tone)).toBeGreaterThanOrEqual(
            target,
          );
        });
      }
    }
    const codeBackgrounds = schemes(palette[`--project-${level}-surface-container-low`]);
    for (const role of ["keyword", "string", "function", "number", "type", "parameter"]) {
      schemes(palette[`--project-${level}-syntax-${role}`]).forEach((foreground, index) => {
        const background = codeBackgrounds[index];
        if (!background) throw new Error("Missing project code background");
        expect(Contrast.ratioOfTones(foreground.tone, background.tone)).toBeGreaterThanOrEqual(
          target,
        );
      });
    }
    const keywords = schemes(palette[`--project-${level}-syntax-keyword`]);
    const functions = schemes(palette[`--project-${level}-syntax-function`]);
    keywords.forEach((keyword, index) => {
      const fn = functions[index];
      if (!fn) throw new Error("Missing syntax function color");
      const difference = Math.abs(keyword.hue - fn.hue);
      expect(Math.min(difference, 360 - difference)).toBeGreaterThan(30);
    });
  }
});

test("uses the corresponding logo for each scheme", async () => {
  const red = { light: "/projects/valibot.png" };
  const purple = { light: "/projects/redux.png" };
  const [redPalette, purplePalette, paired] = await Promise.all([
    generateProjectPalette(red),
    generateProjectPalette(purple),
    generateProjectPalette({ ...red, dark: purple.light }),
  ]);
  const redColors = schemes(redPalette["--project-standard-primary"]);
  const purpleColors = schemes(purplePalette["--project-standard-primary"]);
  const pairedColors = schemes(paired["--project-standard-primary"]);
  expect(pairedColors[0]?.toInt()).toBe(redColors[0]?.toInt());
  expect(pairedColors[1]?.toInt()).toBe(purpleColors[1]?.toInt());
  expect(pairedColors[1]?.toInt()).not.toBe(redColors[1]?.toInt());
});

test("keeps grayscale logos neutral and rejects fully transparent logos", async () => {
  const dir = await mkdtemp("public/project-palette-test-");
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, "logo.png");
  const logo = { light: `/${file.slice("public/".length)}` };
  await sharp({ create: { width: 8, height: 8, channels: 4, background: "#777777" } })
    .png()
    .toFile(file);
  const palette = await generateProjectPalette(logo);
  for (const color of schemes(palette["--project-standard-primary"])) {
    expect(color.chroma).toBeLessThan(5);
  }
  await sharp({ create: { width: 8, height: 8, channels: 4, background: "#00000000" } })
    .png()
    .toFile(file);
  await expect(generateProjectPalette(logo)).rejects.toThrow("No visible logo pixels");
});
