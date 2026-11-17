import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as v from "valibot";

import {
  themeSchema,
  contrastSchema,
  paletteSchema,
  hapticsSchema,
  syntaxSchema,
  matchLightSchema,
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

const syntaxKey = "eskimojo::syntax";

export const getSyntaxFn = createServerFn().handler(() =>
  v.parse(syntaxSchema, getCookie(syntaxKey)),
);

export const setSyntaxFn = createServerFn()
  .validator(syntaxSchema)
  .handler(({ data: syntax }) => setCookie(syntaxKey, syntax));

const matchLightKey = "eskimojo::match-light";

export const getMatchLightFn = createServerFn().handler(() =>
  v.parse(matchLightSchema, getCookie(matchLightKey)),
);

export const setMatchLightFn = createServerFn()
  .validator(matchLightSchema)
  .handler(({ data: matchLight }) => setCookie(matchLightKey, matchLight));
