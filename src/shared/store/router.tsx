import { createAction } from "@reduxjs/toolkit";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment } from "react";
import { Provider } from "react-redux";

import type { AppStore } from ".";

export interface Options<TRouter extends AnyRouter> {
  router: TRouter;
  store: AppStore;
  wrapQueryClient?: boolean;
}

export interface DehydratedReduxOpts {
  state: {};
}

export const hydrated = createAction<DehydratedReduxOpts>("router/hydrated");

export function setupReduxIntegration<TRouter extends AnyRouter>({
  router,
  store,
}: Options<TRouter>) {
  const OGWrap = router.options.Wrap || Fragment;

  router.options.Wrap = ({ children }) => (
    <OGWrap>
      <Provider store={store}>{children}</Provider>
    </OGWrap>
  );

  if (router.isServer) {
    const originalDehydrate = router.options.dehydrate;
    router.options.dehydrate = async (): Promise<{ redux: DehydratedReduxOpts }> => {
      const originalDehydrated = originalDehydrate ? await originalDehydrate() : {};

      return {
        ...originalDehydrated,
        redux: { state: {} } satisfies DehydratedReduxOpts,
      };
    };

    return;
  }

  const originalHydrate = router.options.hydrate;
  router.options.hydrate = async (dehydrated) => {
    if (originalHydrate) {
      await originalHydrate(dehydrated);
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const opts = dehydrated.redux as DehydratedReduxOpts;

    if (opts) {
      store.dispatch(hydrated(opts));
    }
  };
}
