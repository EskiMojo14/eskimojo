import type {
  ListenerMiddlewareInstance,
  StoreEnhancer,
  Store,
  TypedStartListening,
  TypedStopListening,
} from "@reduxjs/toolkit";
import { addListener, removeListener } from "@reduxjs/toolkit";

import type { ExtraArgument, RootState, AppDispatch } from ".";

interface ListenerStoreExtension {
  startListening: this extends Store<infer S>
    ? TypedStartListening<S, this["dispatch"], ExtraArgument>
    : TypedStartListening<unknown>;
  stopListening: this extends Store<infer S>
    ? TypedStopListening<S, this["dispatch"], ExtraArgument>
    : TypedStopListening<unknown>;
}

export const listenerEnhancer =
  (listenerMiddleware: ListenerMiddlewareInstance): StoreEnhancer<ListenerStoreExtension> =>
  (createStore) =>
  (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    return {
      ...store,
      startListening: listenerMiddleware.startListening,
      stopListening: listenerMiddleware.stopListening,
    };
  };

export const addAppListener = addListener.withTypes<RootState, AppDispatch, ExtraArgument>();
export const removeAppListener = removeListener.withTypes<RootState, AppDispatch, ExtraArgument>();
