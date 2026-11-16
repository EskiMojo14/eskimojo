import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

import { listenerEnhancer } from "./listener";
import { rootReducer } from "./reducer";

export type PreloadedState = Parameters<typeof rootReducer>[0];
export type ExtraArgument = undefined;

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

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState,
  extraArgument: ExtraArgument,
) => ReturnType;
