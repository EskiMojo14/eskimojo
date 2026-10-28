import * as v from "valibot";
import { expect, test } from "vite-plus/test";

import { publicImageSchema } from "./content-collections";

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
