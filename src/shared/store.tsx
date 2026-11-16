import { configureStore } from "@reduxjs/toolkit";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";

import { rootReducer } from "./slices";

export type PreloadedState = Parameters<typeof rootReducer>[0];

export function makeStore(preloadedState?: PreloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export interface Options<TRouter extends AnyRouter> {
  router: TRouter;
  store: AppStore;
  wrapQueryClient?: boolean;
}

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
}

export const useAppStore = useStore.withTypes<AppStore>();
export const useAppDispatch = () => useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
