import { addListener, createListenerMiddleware, removeListener } from "@reduxjs/toolkit";

import type { RootState, AppDispatch, ExtraArgument } from "#/shared/store.tsx";

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch,
  ExtraArgument
>();
export const stopAppListening = listenerMiddleware.stopListening.withTypes<
  RootState,
  AppDispatch,
  ExtraArgument
>();
export const addAppListener = addListener.withTypes<RootState, AppDispatch, ExtraArgument>();
export const removeAppListener = removeListener.withTypes<RootState, AppDispatch, ExtraArgument>();
