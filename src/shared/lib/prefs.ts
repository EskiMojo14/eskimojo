import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as v from "valibot";

import { themeSchema, contrastSchema, paletteSchema } from "#/shared/constants/prefs";

const themeKey = "eskimojo::theme";

export const getThemeFn = createServerFn().handler(() => v.parse(themeSchema, getCookie(themeKey)));

export const setThemeFn = createServerFn()
  .validator(themeSchema)
  .handler(({ data: theme }) => setCookie(themeKey, theme));

const contrastKey = "eskimojo::contrast";

export const getContrastFn = createServerFn().handler(() =>
  v.parse(contrastSchema, getCookie(contrastKey)),
);

export const setContrastFn = createServerFn()
  .validator(contrastSchema)
  .handler(({ data: contrast }) => setCookie(contrastKey, contrast));

const paletteKey = "eskimojo::palette";

export const getPaletteFn = createServerFn().handler(() =>
  v.parse(paletteSchema, getCookie(paletteKey)),
);

export const setPaletteFn = createServerFn()
  .validator(paletteSchema)
  .handler(({ data: palette }) => setCookie(paletteKey, palette));
