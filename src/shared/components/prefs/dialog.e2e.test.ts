import { passthrough } from "msw";

import { HomePage } from "#/routes/_home/-index.e2e.model";
import { SnackbarModel } from "#/shared/components/snackbar/index.e2e.model";
import { disposablePromise } from "#/utils";
import { createTest, expect } from "#test/e2e";
import { mockServerFn } from "#test/e2e/msw";
import { serverFns } from "#test/e2e/server-fns.gen";

import { PreferencesDialogModel } from "./dialog.e2e.model";

const test = createTest({
  home: HomePage,
  preferences: PreferencesDialogModel,
  snackbar: SnackbarModel,
});

const prefs = serverFns["src/shared/lib/prefs.ts"];

function preferenceRequests(
  resolver: (value: string) => Response | Promise<Response>,
  refresh: () => Response | Promise<Response> = passthrough,
) {
  return [
    mockServerFn(prefs.setThemeFn, resolver),
    mockServerFn(prefs.setContrastFn, resolver),
    mockServerFn(prefs.setPaletteFn, resolver),
    mockServerFn(prefs.getThemeFn, refresh),
    mockServerFn(prefs.getContrastFn, refresh),
    mockServerFn(prefs.getPaletteFn, refresh),
  ];
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
    ...preferenceRequests(
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
    ...preferenceRequests(async (value) => {
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

test("a failed save rolls back and allows retrying", async ({
  preferences,
  snackbar,
  network,
  page,
}) => {
  using save = disposablePromise();
  network.use(
    mockServerFn(prefs.setThemeFn, async (value) => {
      if (value !== "dark") return passthrough();
      await save.promise;
      throw new Error("Unable to save cookie");
    }),
  );

  await preferences.select("Theme", "Dark");
  await preferences.expectSelected("Theme", "Dark");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  save.resolve();
  await preferences.expectSelected("Theme", "System");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "system");

  await preferences.close();
  await expect(snackbar.notifications).toContainText("Couldn't save theme preference");
  await expect(snackbar.dismissButton).toBeVisible();
  await snackbar.dismiss();
  await expect(snackbar.notifications).not.toContainText("Couldn't save theme preference");
  await preferences.open();
  await preferences.select("Theme", "Light");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
});
