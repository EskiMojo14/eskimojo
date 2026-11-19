import {
  configureStore,
  createListenerMiddleware,
  type UnsubscribeListener,
} from "@reduxjs/toolkit";
import { expectTypeOf, describe, it } from "vite-plus/test";

import { addAppListener, listenerEnhancer } from "./listener";

describe("listenerEnhancer", () => {
  it("should infer types from store", () => {
    const middleware = createListenerMiddleware();

    const store = configureStore({
      reducer: (state: number = 0) => ++state,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(middleware.middleware),
      enhancers: (getDefaultEnhancers) =>
        // oxlint-disable-next-line e18e/prefer-spread-syntax
        getDefaultEnhancers().concat(listenerEnhancer(middleware)),
    });

    expectTypeOf(store.getState()).toEqualTypeOf<number>();
    store.startListening({
      type: "increment",
      effect: (action, listenerApi) => {
        expectTypeOf(action).toEqualTypeOf<{ type: "increment" }>();
        expectTypeOf(listenerApi.getState()).toEqualTypeOf<number>();
        expectTypeOf(
          listenerApi.dispatch(
            addAppListener({
              type: "increment",
              effect: () => {},
            }),
          ),
        ).toEqualTypeOf<UnsubscribeListener>();
      },
    });
  });
});
