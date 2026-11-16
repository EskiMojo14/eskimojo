import {
  configureStore,
  createListenerMiddleware,
  addListener,
  removeListener,
  type Store,
  type TypedStartListening,
  type TypedStopListening,
  type StoreEnhancer,
  type ListenerMiddlewareInstance,
} from "@reduxjs/toolkit";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";

import { rootReducer } from "./slices";

export type PreloadedState = Parameters<typeof rootReducer>[0];
export type ExtraArgument = undefined;

interface AppStoreWithListeners extends Store {
  startListening: TypedStartListening<
    ReturnType<this["getState"]>,
    this["dispatch"],
    ExtraArgument
  >;
  stopListening: TypedStopListening<ReturnType<this["getState"]>, this["dispatch"], ExtraArgument>;
}

const listenerEnhancer =
  (listenerMiddleware: ListenerMiddlewareInstance): StoreEnhancer<AppStoreWithListeners> =>
  (createStore) =>
  // @ts-expect-error
  (reducer, preloadedState) => ({
    ...createStore(reducer, preloadedState),
    startListening: listenerMiddleware.startListening,
    stopListening: listenerMiddleware.stopListening,
  });

export function makeStore(
  preloadedState?: PreloadedState,
  listenerMiddleware = createListenerMiddleware(),
) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: undefined,
        },
      }).prepend(listenerMiddleware.middleware),
    enhancers: (getDefaultEnhancers) =>
      // oxlint-disable-next-line e18e/prefer-spread-syntax
      getDefaultEnhancers().concat(listenerEnhancer(listenerMiddleware)),
  });
}

export const addAppListener = addListener.withTypes<RootState, AppDispatch, ExtraArgument>();
export const removeAppListener = removeListener.withTypes<RootState, AppDispatch, ExtraArgument>();

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
