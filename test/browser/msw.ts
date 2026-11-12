import { http, HttpResponse } from "msw/http";
import type { SerovalJSON } from "seroval";
import { fromJSON, toCrossJSONAsync } from "seroval";

/** Mocks a Vite-compiled server function in browser tests. */
export function mockServerFn<const TData, const TResponse>(
  serverFn: {
    (options: { data: TData }): Promise<TResponse>;
    url: string;
    method: "GET" | "POST";
  },
  mock: (data: NoInfer<TData>) => NoInfer<TResponse> | Promise<NoInfer<TResponse>>,
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
