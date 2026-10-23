import { useQueryClient } from "@tanstack/react-query";
import { createMemoryHistory, useRouter } from "@tanstack/react-router";
import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { getRouter } from "#/router";
import { ThemeContext, useTheme, useContrast, usePalette } from "#/shared/components/prefs/context";
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

function PreferenceProbe() {
  const { theme, setTheme } = useTheme();
  const { contrast, setContrast } = useContrast();
  const { palette, setPalette } = usePalette();
  return (
    <>
      <p>{`${theme}/${contrast}/${palette}`}</p>
      <button onClick={() => setTheme("dark")}>Set dark theme</button>
      <button onClick={() => setContrast("high")}>Set high contrast</button>
      <button onClick={() => setPalette("arctic")}>Set arctic palette</button>
    </>
  );
}

test("provides schema defaults and stateful preference setters", async ({ onTestFinished }) => {
  const result = await page.renderWithProviders(<PreferenceProbe />);
  onTestFinished(() => result.queryClient.clear());

  await expect.element(result.getByText("system/system/goat")).toBeVisible();
  await result.getByRole("button", { name: "Set dark theme" }).click();
  await result.getByRole("button", { name: "Set high contrast" }).click();
  await result.getByRole("button", { name: "Set arctic palette" }).click();
  await expect.element(result.getByText("dark/high/arctic")).toBeVisible();
  await result.rerender(<PreferenceProbe />);
  await expect.element(result.getByText("dark/high/arctic")).toBeVisible();
});

test("supports initial preferences and isolates separate renders", async ({ onTestFinished }) => {
  const first = await page.renderWithProviders(<PreferenceProbe />, {
    preferences: { theme: "light", contrast: "medium", palette: "arctic" },
  });
  onTestFinished(() => first.queryClient.clear());
  await expect.element(first.getByText("light/medium/arctic")).toBeVisible();
  await first.getByRole("button", { name: "Set dark theme" }).click();
  await expect.element(first.getByText("dark/medium/arctic")).toBeVisible();
  await first.unmount();

  const second = await page.renderWithProviders(<PreferenceProbe />);
  onTestFinished(() => second.queryClient.clear());
  await expect.element(second.getByText("system/system/goat")).toBeVisible();
});

test("leaves document preferences unchanged by default", async ({ onTestFinished }) => {
  const { dataset } = document.documentElement;
  const before = Object.entries(dataset);
  const result = await page.renderWithProviders(<PreferenceProbe />);
  onTestFinished(() => result.queryClient.clear());
  await result.getByRole("button", { name: "Set dark theme" }).click();
  await expect.element(result.getByText("dark/system/goat")).toBeVisible();
  expect(Object.entries(dataset)).toEqual(before);
});

test("optionally syncs document preferences and restores attributes on unmount", async ({
  onTestFinished,
}) => {
  const root = document.documentElement;
  const attributes = ["data-theme", "data-contrast", "data-palette"];
  const previous = attributes.map((name) => [name, root.getAttribute(name)] as const);
  onTestFinished(() => {
    for (const [name, value] of previous) {
      if (value === null) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
  });
  root.dataset.theme = "light";
  delete root.dataset.contrast;
  root.dataset.palette = "arctic";

  const result = await page.renderWithProviders(<PreferenceProbe />, {
    syncPreferencesToDocument: true,
  });
  onTestFinished(() => result.queryClient.clear());
  expect(root.dataset.theme).toBe("system");
  expect(root.dataset.contrast).toBe("system");
  expect(root.dataset.palette).toBe("goat");
  await result.getByRole("button", { name: "Set dark theme" }).click();
  await result.getByRole("button", { name: "Set high contrast" }).click();
  await result.getByRole("button", { name: "Set arctic palette" }).click();
  expect(root.dataset.theme).toBe("dark");
  expect(root.dataset.contrast).toBe("high");
  expect(root.dataset.palette).toBe("arctic");
  await result.unmount();
  expect(root.dataset.theme).toBe("light");
  expect(root.hasAttribute("data-contrast")).toBe(false);
  expect(root.dataset.palette).toBe("arctic");
});

test("allows explicit preference providers without in-memory providers", async ({
  onTestFinished,
}) => {
  const result = await page.renderWithProviders(
    <ThemeContext value={{ theme: "light", setTheme: () => {} }}>
      <PreferenceProbe />
    </ThemeContext>,
    { preferences: false },
  );
  onTestFinished(() => result.queryClient.clear());
  await expect.element(result.getByText("light/system/goat")).toBeVisible();
});

test("renders with isolated query and memory-router providers", async ({ onTestFinished }) => {
  const result = await page.renderWithProviders(<ContextProbe />);
  onTestFinished(() => result.queryClient.clear());

  await expect.element(result.getByText("Shared client")).toBeVisible();
  expect(result.router.options.context.queryClient).toBe(result.queryClient);
  expect(result.router.history).toBe(result.history);
});

test("reuses an existing router's providers", async ({ onTestFinished }) => {
  const queryClient = createQueryClient();
  onTestFinished(() => queryClient.clear());
  const history = createMemoryHistory({ initialEntries: ["/"] });
  const router = getRouter({ queryClient, history });
  const result = await page.renderWithProviders(<ContextProbe />, { router });

  await expect.element(result.getByText("Shared client")).toBeVisible();
  expect(result.queryClient).toBe(queryClient);
  expect(result.history).toBe(history);
  expect(result.router).toBe(router);
});

test("mocks browser requests with the shared network setup", async () => {
  network.use(http.get("/test-network", () => HttpResponse.text("browser mock")));

  expect(await (await fetch("/test-network")).text()).toBe("browser mock");
});
