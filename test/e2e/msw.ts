import { http, HttpResponse } from "msw";
import { fromJSON, toCrossJSONAsync } from "seroval";

type ServerFunction = {
  (...args: Array<never>): Promise<unknown>;
  url: string;
};

interface ServerFnRef<TData, TResponse> {
  url: string;
  /** Type-only information; the application function is never imported at runtime. */
  types?: { data: TData; response: TResponse };
}

type ServerFnData<TFunction extends ServerFunction> =
  NonNullable<Parameters<TFunction>[0]> extends { data?: infer TData } ? TData : undefined;

export function serverFnRef<TFunction extends ServerFunction>(
  url: string,
): ServerFnRef<ServerFnData<TFunction>, Awaited<ReturnType<TFunction>>> {
  return { url };
}

async function requestData(request: Request): Promise<unknown> {
  let payload: unknown;
  if (request.method === "GET") {
    const param = new URL(request.url).searchParams.get("payload");
    if (param) payload = fromJSON(JSON.parse(param));
  } else if (request.method === "POST") {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new Error(
        "mockServerFn only supports JSON POST requests; use a custom MSW handler for FormData.",
      );
    payload = fromJSON(await request.json());
  } else {
    throw new Error(`Unsupported mockServerFn request method: ${request.method}`);
  }
  if (payload === undefined) return undefined;
  if (typeof payload !== "object" || payload === null)
    throw new Error("Expected an object in the TanStack server-function payload.");
  return "data" in payload ? payload.data : undefined;
}

/**
 * Mocks a generated E2E server-function descriptor, not SSR calls.
 * Returns and thrown errors use TanStack's wire format; Response values pass through unchanged.
 */
export function mockServerFn<const TData, const TResponse>(
  serverFn: ServerFnRef<TData, TResponse>,
  mock: (
    data: NoInfer<TData>,
  ) => NoInfer<TResponse> | Response | Promise<NoInfer<TResponse> | Response>,
) {
  return http.all(serverFn.url, async ({ request }) => {
    const data = await requestData(request);
    let result: TResponse | Response;
    try {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      result = await mock(data as TData);
    } catch (error) {
      return HttpResponse.json(await toCrossJSONAsync({ error }), {
        headers: { "x-tss-serialized": "true" },
      });
    }
    if (result instanceof Response) return result;
    return HttpResponse.json(await toCrossJSONAsync({ result }), {
      headers: { "x-tss-serialized": "true" },
    });
  });
}
