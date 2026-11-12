import { HttpResponse } from "msw";
import { fromCrossJSON, toJSONAsync } from "seroval";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";

import { mockServerFn, serverFnRef } from "./msw";

type PostFn = {
  (options: { data: { id: string; updatedAt: Date } }): Promise<{ title: string; updatedAt: Date }>;
  url: string;
};

const post = serverFnRef<PostFn>("http://localhost/_serverFn/post");

test.each(["GET", "POST"])(
  "decodes %s data and serializes the typed mock result",
  async (method) => {
    const updatedAt = new Date("2026-01-01T00:00:00Z");
    network.use(
      mockServerFn(post, (data) => {
        expect(data.updatedAt).toEqual(updatedAt);
        return { title: `Post ${data.id}`, updatedAt: data.updatedAt };
      }),
    );
    const payload = JSON.stringify(await toJSONAsync({ data: { id: "1", updatedAt } }));
    const response = await fetch(
      method === "GET" ? `${post.url}?payload=${encodeURIComponent(payload)}` : post.url,
      {
        method,
        ...(method === "POST"
          ? { body: payload, headers: { "content-type": "application/json" } }
          : {}),
      },
    );
    expect(response.headers.get("x-tss-serialized")).toBe("true");
    expect(fromCrossJSON(await response.json(), {})).toEqual({
      result: { title: "Post 1", updatedAt },
    });
  },
);

test("mocks a no-input function and serializes thrown errors", async () => {
  type NoInputFn = { (): Promise<string>; url: string };
  const fn = serverFnRef<NoInputFn>("http://localhost/_serverFn/no-input");
  network.use(
    mockServerFn(fn, (data) => {
      expect(data).toBeUndefined();
      throw new Error("Service unavailable");
    }),
  );
  const response = await fetch(fn.url);
  const result = fromCrossJSON(await response.json(), {});
  expect(result).toEqual({ error: expect.any(Error) });
  expect(result).toMatchObject({ error: { message: "Service unavailable" } });
});

test("preserves raw responses without wrapping them in the TanStack protocol", async () => {
  network.use(mockServerFn(post, () => new HttpResponse("raw", { status: 418 })));
  const response = await fetch(post.url);
  expect(response.status).toBe(418);
  expect(await response.text()).toBe("raw");
  expect(response.headers.has("x-tss-serialized")).toBe(false);
});

test("rejects unsupported request encodings instead of treating them as successful mocks", async () => {
  network.use(mockServerFn(post, () => ({ title: "not called", updatedAt: new Date() })));
  const response = await fetch(post.url, { method: "POST", body: new FormData() });
  expect(response.status).toBe(500);
  expect(await response.text()).toContain("only supports JSON POST requests");
});
