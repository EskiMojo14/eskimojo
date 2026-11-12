import { rootRouteId, useRouter } from "@tanstack/react-router";
import {
  startTransition,
  useActionState,
  useOptimistic,
  type Context,
  type FC,
  type ReactNode,
} from "react";

import { setThemeFn, setContrastFn, setPaletteFn } from "#/shared/lib/prefs";
import { capitalize } from "#/utils";
import type { Compute } from "#/utils/types";

import type { PrefContextValue } from "./context";
import { ThemeContext, ContrastContext, PaletteContext } from "./context";

type PrefProviderProps<Name extends string, Value> = Compute<
  Record<Name, Value> & { children: ReactNode }
>;

function createPrefProvider<Name extends string, Value extends string>(
  name: Name,
  Ctx: Context<PrefContextValue<Name, Value>>,
  serverFn: (opts: { data: Value }) => Promise<unknown>,
) {
  const PrefProvider: FC<PrefProviderProps<Name, Value>> = ({ children, [name]: value }) => {
    const router = useRouter();
    const [optimisticValue, setOptimisticValue] = useOptimistic<Value>(value);
    const [, savePref] = useActionState<null, Value>(async (_, data) => {
      try {
        await serverFn({ data });
        await router.invalidate({
          filter: (d) => d.id === rootRouteId,
          sync: true,
        });
      } catch (error) {
        console.error(`Unable to update ${name} preference`, error);
      }
      return null;
    }, null);

    function setPref(data: Value) {
      startTransition(() => {
        setOptimisticValue(data);
        savePref(data);
      });
    }
    return (
      <Ctx
        value={
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          {
            [name]: optimisticValue,
            [`set${capitalize(name)}`]: setPref,
          } as never
        }
      >
        {children}
      </Ctx>
    );
  };
  PrefProvider.displayName = `${capitalize(name)}Provider`;
  return PrefProvider;
}

export const ThemeProvider = createPrefProvider("theme", ThemeContext, setThemeFn);
export const ContrastProvider = createPrefProvider("contrast", ContrastContext, setContrastFn);
export const PaletteProvider = createPrefProvider("palette", PaletteContext, setPaletteFn);
