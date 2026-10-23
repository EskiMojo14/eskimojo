import { rootRouteId, useRouter } from "@tanstack/react-router";
import type { Context, FC, ReactNode } from "react";

import { setThemeFn, setContrastFn, setPaletteFn } from "#/shared/lib/prefs";
import { capitalize } from "#/utils";
import type { Compute } from "#/utils/types";

import type { PrefContextValue } from "./context";
import { ThemeContext, ContrastContext, PaletteContext } from "./context";

type PrefProviderProps<Name extends string, Value> = Compute<
  Record<Name, Value> & { children: ReactNode }
>;

function createPrefProvider<Name extends string, Value>(
  name: Name,
  Ctx: Context<PrefContextValue<Name, Value>>,
  serverFn: (opts: { data: Value }) => Promise<unknown>,
) {
  const PrefProvider: FC<PrefProviderProps<Name, Value>> = ({ children, [name]: value }) => {
    const router = useRouter();
    function setPref(data: Value) {
      void serverFn({ data }).then(() =>
        router.invalidate({
          filter: (d) => d.id === rootRouteId,
        }),
      );
    }
    return (
      <Ctx
        value={
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          {
            [name]: value,
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
