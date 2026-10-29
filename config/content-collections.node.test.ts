import * as v from "valibot";
import { expect, test } from "vite-plus/test";

import { projectLogoSchema, publicImageSchema } from "./content-collections";

test.each([
  "/Goat-avatar.webp",
  "/projects/redux.png",
  "/projects/neocities-light.svg",
  "/sources/Goat_square-1.jpeg",
])("accepts an existing public image: %s", (src) => {
  expect(v.parse(publicImageSchema, src)).toBe(src);
});

test.each([
  "/projects/missing-logo.png",
  "/Goat_square-1.jpeg",
  "projects/redux.png",
  "https://example.com/logo.png",
  "//example.com/logo.png",
  "/../public/Goat-avatar.webp",
  "/sources/../Goat-avatar.webp",
  "/projects/./redux.png",
  "/projects/redux.png?version=1",
  "/projects/redux.png#logo",
  "/projects\\redux.png",
  "/projects/\0.png",
  "/fonts/OFL.txt",
])("rejects a missing or invalid public image: %s", (src) => {
  expect(v.safeParse(publicImageSchema, src).success).toBe(false);
});

test("accepts a Material Symbol instead of a logo image", () => {
  expect(v.parse(projectLogoSchema, { symbol: "stream" })).toEqual({ symbol: "stream" });
});

test("preserves themed and social logo images", () => {
  const logo = {
    light: "/projects/redux.png",
    dark: "/projects/neocities-light.svg",
    social: "/sources/Goat_square-1.jpeg",
  };
  expect(v.parse(projectLogoSchema, logo)).toEqual(logo);
});

test.each(["", " ", "Stream", "not a symbol", "stream,home"])(
  "rejects an invalid Material Symbol name: %s",
  (symbol) => {
    expect(v.safeParse(projectLogoSchema, { symbol }).success).toBe(false);
  },
);
