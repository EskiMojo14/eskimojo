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
    mockServerFn(prefs.setHapticsFn, resolver),
    mockServerFn(prefs.setSyntaxFn, resolver),
    mockServerFn(prefs.setMatchLightFn, resolver),
    mockServerFn(prefs.getThemeFn, refresh),
    mockServerFn(prefs.getContrastFn, refresh),
    mockServerFn(prefs.getPaletteFn, refresh),
    mockServerFn(prefs.getHapticsFn, refresh),
    mockServerFn(prefs.getSyntaxFn, refresh),
    mockServerFn(prefs.getMatchLightFn, refresh),
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

  await preferences.theme.select();
  await preferences.theme.setPreference("Theme", "Dark");
  await preferences.theme.setPreference("Contrast", "High");
  await preferences.theme.setPreference("Palette", "Arctic");
  await preferences.syntax.select();
  await preferences.syntax.setSyntax("Blade");
  await preferences.syntax.setMatchLight(false);
  await preferences.theme.select();
  await preferences.theme.expectSelected("Theme", "Dark");
  await preferences.theme.expectSelected("Contrast", "High");
  await preferences.theme.expectSelected("Palette", "Arctic");
  await preferences.syntax.select();
  await preferences.syntax.expectSelected("Blade");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
  await expect(preferences.documentElement).toHaveAttribute("data-syntax", "blade");
  await expect(preferences.documentElement).toHaveAttribute("data-match-light", "off");
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
      "eskimojo::syntax": "blade",
      "eskimojo::match-light": "off",
    });
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
  await expect(preferences.documentElement).toHaveAttribute("data-syntax", "blade");
  await expect(preferences.documentElement).toHaveAttribute("data-match-light", "off");
  refresh.resolve();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect(preferences.documentElement).toHaveAttribute("data-contrast", "high");
  await expect(preferences.documentElement).toHaveAttribute("data-palette", "arctic");
  await expect(preferences.documentElement).toHaveAttribute("data-syntax", "blade");
  await expect(preferences.documentElement).toHaveAttribute("data-match-light", "off");
  await preferences.open();
  await preferences.syntax.select();
  await expect(preferences.syntax.matchLightSwitch).not.toBeChecked();
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

  await preferences.theme.select();
  await preferences.theme.setPreference("Theme", "Dark");
  await preferences.theme.setPreference("Theme", "Light");
  await preferences.theme.expectSelected("Theme", "Light");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");

  save.resolve();
  await expect
    .poll(
      async () => (await context.cookies()).find(({ name }) => name === "eskimojo::theme")?.value,
    )
    .toBe("light");
  await page.waitForLoadState("networkidle");
  await preferences.theme.expectSelected("Theme", "Light");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
});

test("haptic feedback saves optimistically and stays off after navigation and reload", async ({
  home,
  preferences,
  page,
  context,
  network,
}) => {
  using save = disposablePromise();
  network.use(
    mockServerFn(prefs.setHapticsFn, async () => {
      await save.promise;
      return passthrough();
    }),
  );
  await preferences.other.select();
  await expect(preferences.other.hapticsSwitch).toBeChecked();
  await preferences.other.setHaptics(false);
  expect(
    (await context.cookies()).find(({ name }) => name === "eskimojo::haptics"),
  ).toBeUndefined();

  save.resolve();
  await expect
    .poll(
      async () => (await context.cookies()).find(({ name }) => name === "eskimojo::haptics")?.value,
    )
    .toBe("off");
  await page.waitForLoadState("networkidle");
  await preferences.close();
  await home.goto({ waitUntil: "networkidle" });
  await preferences.open();
  await preferences.other.select();
  await expect(preferences.other.hapticsSwitch).not.toBeChecked();
  await page.reload();
  await preferences.open();
  await preferences.other.select();
  await expect(preferences.other.hapticsSwitch).not.toBeChecked();
});

test("failed haptics saves roll back, notify, and allow retrying", async ({
  preferences,
  snackbar,
  page,
  context,
  network,
}) => {
  using save = disposablePromise();
  network.use(
    mockServerFn(prefs.setHapticsFn, async () => {
      await save.promise;
      throw new Error("Unable to save cookie");
    }),
  );
  await preferences.other.select();
  await preferences.other.setHaptics(false);
  save.resolve();
  await expect(preferences.other.hapticsSwitch).toBeChecked();
  expect(
    (await context.cookies()).find(({ name }) => name === "eskimojo::haptics"),
  ).toBeUndefined();
  await preferences.close();
  await expect(snackbar.notifications).toContainText("Couldn't save haptics preference");
  await snackbar.dismiss();
  await preferences.open();

  network.use(mockServerFn(prefs.setHapticsFn, () => passthrough()));
  await preferences.other.select();
  await preferences.other.setHaptics(false);
  await expect
    .poll(
      async () => (await context.cookies()).find(({ name }) => name === "eskimojo::haptics")?.value,
    )
    .toBe("off");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await preferences.open();
  await preferences.other.select();
  await expect(preferences.other.hapticsSwitch).not.toBeChecked();
});

test("a failed save rolls back and allows retrying", async ({
  preferences,
  snackbar,
  network,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  using save = disposablePromise();
  network.use(
    mockServerFn(prefs.setThemeFn, async (value) => {
      if (value !== "dark") return passthrough();
      await save.promise;
      throw new Error("Unable to save cookie");
    }),
  );

  await preferences.theme.select();
  await preferences.theme.setPreference("Theme", "Dark");
  await preferences.theme.expectSelected("Theme", "Dark");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#161217"]);
  save.resolve();
  await preferences.theme.expectSelected("Theme", "System");
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "system");
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#fff7fb"]);

  await preferences.close();
  await expect(snackbar.notifications).toContainText("Couldn't save theme preference");
  await expect(snackbar.dismissButton).toBeVisible();
  await snackbar.dismiss();
  await expect(snackbar.notifications).not.toContainText("Couldn't save theme preference");
  await preferences.open();
  await preferences.theme.select();
  await preferences.theme.setPreference("Theme", "Light");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(preferences.documentElement).toHaveAttribute("data-theme", "light");
});

test("browser theme colour follows system and saved appearance preferences", async ({
  preferences,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", contrast: "no-preference" });
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#fff7fb"]);
  await expect
    .poll(() => preferences.activeThemeColorMedia())
    .toEqual(["(prefers-color-scheme: light) and (not (prefers-contrast: more))"]);

  await page.emulateMedia({ colorScheme: "dark", contrast: "more" });
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#161217"]);
  await expect
    .poll(() => preferences.activeThemeColorMedia())
    .toEqual(["(prefers-color-scheme: dark) and (prefers-contrast: more)"]);

  await preferences.theme.select();
  await preferences.theme.setPreference("Palette", "Arctic");
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#121318"]);
  await preferences.theme.setPreference("Theme", "Light");
  await preferences.theme.setPreference("Contrast", "Medium");
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#faf8ff"]);
  await expect.poll(() => preferences.activeThemeColorMedia()).toEqual([null]);

  await page.emulateMedia({ colorScheme: "dark", contrast: "no-preference" });
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#faf8ff"]);
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#faf8ff"]);

  await preferences.open();
  await preferences.theme.select();
  await preferences.theme.setPreference("Theme", "System");
  await preferences.theme.setPreference("Contrast", "System");
  await expect.poll(() => preferences.activeThemeColors()).toEqual(["#121318"]);
});

test("browser theme colour works before hydration and with JavaScript disabled", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  try {
    const noJsPage = await context.newPage();
    const noJsPreferences = new PreferencesDialogModel(noJsPage);
    await noJsPage.goto(page.url());
    await expect.poll(() => noJsPreferences.activeThemeColors()).toEqual(["#161217"]);
    await noJsPage.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => noJsPreferences.activeThemeColors()).toEqual(["#fff7fb"]);
    await expect(noJsPreferences.documentElement).toHaveAttribute("data-syntax", "dracula-pro");
    await expect(noJsPreferences.documentElement).toHaveAttribute("data-match-light", "on");

    await context.addCookies([
      { name: "eskimojo::palette", value: "arctic", url: page.url() },
      { name: "eskimojo::theme", value: "dark", url: page.url() },
      { name: "eskimojo::contrast", value: "high", url: page.url() },
      { name: "eskimojo::syntax", value: "buffy", url: page.url() },
      { name: "eskimojo::match-light", value: "off", url: page.url() },
    ]);
    await noJsPage.reload();
    await expect.poll(() => noJsPreferences.activeThemeColors()).toEqual(["#121318"]);
    await expect(noJsPreferences.documentElement).toHaveAttribute("data-syntax", "buffy");
    await expect(noJsPreferences.documentElement).toHaveAttribute("data-match-light", "off");
  } finally {
    await context.close();
  }
});
