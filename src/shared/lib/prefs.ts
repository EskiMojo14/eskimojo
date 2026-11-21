import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as v from "valibot";

import {
  themeSchema,
  contrastSchema,
  paletteSchema,
  hapticsSchema,
  darkSyntaxOptions,
  lightSyntaxOptions,
  lightSyntaxSchema,
  darkSyntaxSchema,
  densitySchema,
} from "#/shared/constants/prefs";

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

const hapticsKey = "eskimojo::haptics";

export const getHapticsFn = createServerFn().handler(() =>
  v.parse(hapticsSchema, getCookie(hapticsKey)),
);

export const setHapticsFn = createServerFn()
  .validator(hapticsSchema)
  .handler(({ data: haptics }) => setCookie(hapticsKey, haptics));

const densityKey = "eskimojo::density";

export const getDensityFn = createServerFn().handler(() =>
  v.parse(densitySchema, getCookie(densityKey)),
);

export const setDensityFn = createServerFn()
  .validator(densitySchema)
  .handler(({ data: density }) => setCookie(densityKey, density));

const darkSyntaxKey = "eskimojo::dark-syntax";
const lightSyntaxKey = "eskimojo::light-syntax";

export const getDarkSyntaxFn = createServerFn().handler(() =>
  v.parse(darkSyntaxSchema, getCookie(darkSyntaxKey)),
);

export const setDarkSyntaxFn = createServerFn()
  .validator(darkSyntaxOptions)
  .handler(({ data }) => setCookie(darkSyntaxKey, data));

export const getLightSyntaxFn = createServerFn().handler(() =>
  v.parse(lightSyntaxSchema, getCookie(lightSyntaxKey)),
);

export const setLightSyntaxFn = createServerFn()
  .validator(lightSyntaxOptions)
  .handler(({ data }) => setCookie(lightSyntaxKey, data));
