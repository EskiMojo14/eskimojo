import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { network } from "virtual:msw";
import { describe, it, expect } from "vite-plus/test";

import { mockServerFn } from "./msw";

const getPost = createServerFn({ method: "GET" })
  .validator(v.object({ id: v.string() }))
  .handler(async ({ data }) => {
    return { id: data.id, title: "Sample Title" };
  });

const updatePost = createServerFn({ method: "POST" })
  .validator(v.object({ id: v.string(), title: v.string() }))
  .handler(async ({ data }) => {
    return { id: data.id, title: data.title };
  });

describe("mockServerFn", () => {
  it("mocks GET server functions", async () => {
    network.use(
      mockServerFn(getPost, (data) => {
        return { id: data.id, title: "Mocked Title" };
      }),
    );
    await expect(getPost({ data: { id: "1" } })).resolves.toEqual({
      id: "1",
      title: "Mocked Title",
    });
  });
  it("mocks POST server functions", async () => {
    network.use(
      mockServerFn(updatePost, (data) => {
        return { id: data.id, title: "Mocked Title" };
      }),
    );
    await expect(updatePost({ data: { id: "1", title: "Original Title" } })).resolves.toEqual({
      id: "1",
      title: "Mocked Title",
    });
  });
});
