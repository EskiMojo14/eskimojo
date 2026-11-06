import { isCommonAssetRequest } from "msw";
import {
  HttpNetworkFrame,
  WebSocketNetworkFrame,
  type DefineNetworkOptions,
} from "msw/experimental";
import { http, HttpResponse } from "msw/http";
import type { SerovalJSON } from "seroval";
import { fromJSON, toCrossJSONAsync } from "seroval";

type UnhandledFrameCallback = Extract<
  NonNullable<DefineNetworkOptions<[]>["onUnhandledFrame"]>,
  (...args: never) => unknown
>;

/**
 * Pass unmocked requests and WebSocket connections to the app's own host (e.g. server functions, Vite HMR)
 * and static assets (including Google Fonts) through quietly; warn about anything else.
 */
export function bypassLocalRequests(appUrl: string): UnhandledFrameCallback {
  const { host } = new URL(appUrl);
  return ({ frame, defaults }) => {
    if (frame instanceof HttpNetworkFrame) {
      const { request } = frame.data;
      const url = new URL(request.url);
      if (
        url.host === host ||
        url.hostname === "fonts.gstatic.com" ||
        isCommonAssetRequest(request)
      ) {
        return;
      }
    }
    if (frame instanceof WebSocketNetworkFrame && frame.data.connection.client.url.host === host) {
      return;
    }
    defaults.warn();
  };
}

/**
 * Mock a server function for testing with MSW.
 * Intercepts requests to the server function's URL and responds with the provided mock implementation.
 *
 * @remarks
 * Only works in browser tests.
 * Node tests are compiled as if they're running on the server, so no requests are made. Mock the function directly instead.
 * E2E tests don't compile the server functions, so the `.url` property won't exist.
 *
 * @param serverFn The server function to mock.
 * @param mock The mock implementation to use for the server function.
 * @returns A handler that can be used with MSW to intercept requests to the server function.
 *
 * @example
 * network.use(
 *   mockServerFn(getPost, ({ id }) => {
 *     return { id, title: "Mocked Post" };
 *   });
 * )
 */
export function mockServerFn<TData, TResponse>(
  serverFn: {
    (options: { data: TData }): Promise<TResponse>;
    url: string;
    method: "GET" | "POST";
  },
  mock: (data: TData) => TResponse | Promise<TResponse>,
) {
  return http.all<never, SerovalJSON>(serverFn.url, async ({ request }) => {
    try {
      let payload: unknown;
      switch (serverFn.method) {
        case "GET": {
          const param = new URL(request.url).searchParams.get("payload");
          if (param) {
            payload = fromJSON(JSON.parse(param));
          }
          break;
        }
        case "POST": {
          payload = fromJSON(await request.json());
          break;
        }
        default: {
          throw new Error(`Unsupported method: ${request.method}`);
        }
      }
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const data = (payload as { data: TData } | undefined)?.data;
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const result = await mock(data as TData);
      return HttpResponse.json(await toCrossJSONAsync({ result }), {
        headers: { "x-tss-serialized": "true" },
      });
    } catch (error) {
      return HttpResponse.json(await toCrossJSONAsync({ error }), {
        headers: { "x-tss-serialized": "true" },
      });
    }
  });
}
