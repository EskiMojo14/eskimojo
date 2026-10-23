import { createOptionalContext } from "required-react-context";
import type * as v from "valibot";

import { themeSchema, contrastSchema, paletteSchema } from "#/shared/constants/prefs";
import { capitalize } from "#/utils";
import type { Compute } from "#/utils/types";

export type PrefContextValue<Name extends string, Value> = Compute<
  Record<Name, Value> & Record<`set${Capitalize<Name>}`, (value: Value) => void>
>;

function createPrefContext<Name extends string, Value>(
  name: Name,
  schema: v.SchemaWithFallback<v.GenericSchema<Value>, Value>,
) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return createOptionalContext<PrefContextValue<Name, Value>>({
    [name]: schema.fallback,
    [`set${capitalize(name)}`]: () => {},
  } as never).with({ name });
}

export const { ThemeContext, useTheme } = createPrefContext("theme", themeSchema);
export const { ContrastContext, useContrast } = createPrefContext("contrast", contrastSchema);
export const { PaletteContext, usePalette } = createPrefContext("palette", paletteSchema);
