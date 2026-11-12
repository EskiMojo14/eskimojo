import { http, HttpResponse, passthrough } from "msw";
import { fromJSON, toCrossJSONAsync } from "seroval";
import * as v from "valibot";

import { HomePage } from "#/routes/_home/-index.e2e.model";
import { disposablePromise } from "#/utils";
import { createTest, expect } from "#test/e2e";

import { PreferencesDialogModel } from "./dialog.e2e.model";

const test = createTest({ home: HomePage, preferences: PreferencesDialogModel });

const preferenceRequestSchema = v.object({ data: v.string() });

function preferenceRequests(
  resolver: (value: string) => Response | Promise<Response>,
  refresh: () => Response | Promise<Response> = passthrough,
) {
  return http.get("*/_serverFn/*", ({ request }) => {
    const payload = new URL(request.url).searchParams.get("payload");
    const parsed = payload && v.safeParse(preferenceRequestSchema, fromJSON(JSON.parse(payload)));
    if (!parsed || !parsed.success) return refresh();
    return resolver(parsed.output.data);
  });
}

test.beforeEach(async ({ home, preferences }) => {
  await home.goto({ waitUntil: "networkidle" });
  await preferences.open();
});

test("preferences update the controls and page before cookies are saved", async ({
  preferences,
  network,
  context,
  page,
}) => {
  using save = disposablePromise();
  using refresh = disposablePromise();
  network.use(
    preferenceRequests(
      async () => {
        await save.promise;
        return passthrough();
      },
      async () => {
        await refresh.promise;
        return passthrough();
      },
    ),
  );

  await preferences.select("Theme", "Dark");
  await preferences.select("Contrast", "High");
  await preferences.select("Palette", "Arctic");
  await preferences.expectSelected("Theme", "Dark");
  await preferences.expectSelected("Contrast", "High");
  await preferences.expectSelected("Palette", "Arctic");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
  expect(
    (await context.cookies()).filter((cookie) => cookie.name.startsWith("eskimojo::")),
  ).toEqual([]);

  save.resolve();
  await expect
    .poll(async () =>
      Object.fromEntries((await context.cookies()).map(({ name, value }) => [name, value])),
    )
    .toMatchObject({
      "eskimojo::theme": "dark",
      "eskimojo::contrast": "high",
      "eskimojo::palette": "arctic",
    });
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
  refresh.resolve();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
});

test("rapid changes keep the latest selection and persist in order", async ({
  preferences,
  network,
  context,
  page,
}) => {
  using save = disposablePromise();
  network.use(
    preferenceRequests(async (value) => {
      if (value === "dark") await save.promise;
      return passthrough();
    }),
  );

  await preferences.select("Theme", "Dark");
  await preferences.select("Theme", "Light");
  await preferences.expectSelected("Theme", "Light");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");

  save.resolve();
  await expect
    .poll(
      async () => (await context.cookies()).find(({ name }) => name === "eskimojo::theme")?.value,
    )
    .toBe("light");
  await page.waitForLoadState("networkidle");
  await preferences.expectSelected("Theme", "Light");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
});

test("a failed save rolls back and allows retrying", async ({ preferences, network, page }) => {
  using save = disposablePromise();
  network.use(
    preferenceRequests(async (value) => {
      if (value !== "dark") return passthrough();
      await save.promise;
      return HttpResponse.json(
        await toCrossJSONAsync({ error: new Error("Unable to save cookie") }),
        { status: 503, headers: { "x-tss-serialized": "true" } },
      );
    }),
  );

  await preferences.select("Theme", "Dark");
  await preferences.expectSelected("Theme", "Dark");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  save.resolve();
  await preferences.expectSelected("Theme", "System");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "system");

  await preferences.select("Theme", "Light");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
});
