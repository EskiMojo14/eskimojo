import { isCommonAssetRequest } from "msw";
import {
  HttpNetworkFrame,
  WebSocketNetworkFrame,
  type DefineNetworkOptions,
} from "msw/experimental";

type UnhandledFrameCallback = Extract<
  NonNullable<DefineNetworkOptions<[]>["onUnhandledFrame"]>,
  (...args: never) => unknown
>;

/**
 * Pass unmocked requests and WebSocket connections to the app's own host (e.g. server functions, Vite HMR)
 * and static assets through quietly; warn about anything else.
 */
export function bypassLocalRequests(appUrl: string): UnhandledFrameCallback {
  const { host } = new URL(appUrl);
  return ({ frame, defaults }) => {
    if (frame instanceof HttpNetworkFrame) {
      const { request } = frame.data;
      if (new URL(request.url).host === host || isCommonAssetRequest(request)) return;
    }
    if (frame instanceof WebSocketNetworkFrame && frame.data.connection.client.url.host === host) {
      return;
    }
    defaults.warn();
  };
}
