import { useQueryClient } from "@tanstack/react-query";
import { createMemoryHistory, useRouter } from "@tanstack/react-router";
import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { getRouter } from "#/router";
import { createQueryClient } from "#/shared/lib/query";

function ContextProbe() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return (
    <p>
      {queryClient === router.options.context.queryClient ? "Shared client" : "Different clients"}
    </p>
  );
}

test("renders with isolated query and memory-router providers", async () => {
  const result = await page.renderWithProviders(<ContextProbe />);

  await expect.element(result.getByText("Shared client")).toBeVisible();
  expect(result.router.options.context.queryClient).toBe(result.queryClient);
  expect(result.router.history).toBe(result.history);
  result.queryClient.clear();
});

test("reuses an existing router's providers", async () => {
  const queryClient = createQueryClient();
  const history = createMemoryHistory({ initialEntries: ["/"] });
  const router = getRouter({ queryClient, history });
  const result = await page.renderWithProviders(<ContextProbe />, { router });

  await expect.element(result.getByText("Shared client")).toBeVisible();
  expect(result.queryClient).toBe(queryClient);
  expect(result.history).toBe(history);
  expect(result.router).toBe(router);
  queryClient.clear();
});

test("mocks browser requests with the shared network setup", async () => {
  network.use(http.get("/test-network", () => HttpResponse.text("browser mock")));

  expect(await (await fetch("/test-network")).text()).toBe("browser mock");
});
