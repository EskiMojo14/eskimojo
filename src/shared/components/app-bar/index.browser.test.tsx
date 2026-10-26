import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  HeadContent,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, expect, onTestFinished, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { generateMetadata } from "#/shared/lib/document-head";

import { AppBar } from "./index";

beforeEach(async () => {
  await page.viewport(1280, 800);
});

function renderPage() {
  return page.renderWithProviders(
    <div className="app-shell">
      <div className="app-shell__main">
        <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
        <div style={{ height: 1200 }}>Page content</div>
        <footer>End of page</footer>
      </div>
    </div>,
  );
}

test.each([320, 390, 599, 600, 768, 769, 1280])(
  "positions navigation responsively at %i px",
  async (width) => {
    await page.viewport(width, 844);
    const result = await renderPage();
    const actions = result.getByRole("group", { name: "Page actions" }).element();
    const compact = width < 600;
    const navigation = result.container.querySelector<HTMLElement>(".app-bar__bottom-navigation");
    const bounds = actions.getBoundingClientRect();
    expect(bounds.bottom).toBe(64);
    expect(bounds.height).toBe(64);
    expect(actions.querySelector(".app-bar__navigation")?.checkVisibility()).toBe(
      width >= 600 && width <= 768,
    );
    expect(navigation?.checkVisibility()).toBe(compact);
  },
);

test.each([320, 390, 599])(
  "keeps compact navigation fixed and the footer clear at %i px",
  async (width) => {
    await page.viewport(width, 844);
    const result = await renderPage();
    const nav = result.getByRole("navigation", { name: "Primary" });
    expect(nav.getByRole("link").all()).toHaveLength(4);
    expect(nav.element().getBoundingClientRect().bottom).toBe(844);
    expect(nav.element().getBoundingClientRect().height).toBe(80);
    for (const link of nav.getByRole("link").all()) {
      expect(link.element().getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    expect(nav.element().getBoundingClientRect().bottom).toBe(844);
    expect(
      result.getByText("End of page").element().getBoundingClientRect().bottom,
    ).toBeLessThanOrEqual(nav.element().getBoundingClientRect().top);
    window.scrollTo(0, 0);
  },
);

test.each(["tab-forward", "tab-backward", "music-period"])(
  "keeps bottom navigation in a stationary top layer during %s transitions",
  async (type) => {
    await page.viewport(390, 844);
    const result = await page.renderWithProviders(
      <>
        <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
        <div className="tabs__route-content">Before</div>
      </>,
    );
    const transition = document.startViewTransition({
      types: [type],
      update: () => {
        result.getByText("Before").element().textContent = "After";
      },
    });
    onTestFinished(() => transition.finished);
    await transition.ready;
    const navigation = result.getByRole("navigation", { name: "Primary" }).element();
    expect(getComputedStyle(navigation).viewTransitionName).toBe("bottom-navigation");
    const navigationLayer = getComputedStyle(
      document.documentElement,
      "::view-transition-group(bottom-navigation)",
    );
    expect(Number(navigationLayer.zIndex)).toBe(1);
    expect(navigationLayer.animationName).toBe("none");
    expect(
      getComputedStyle(document.documentElement, "::view-transition-new(bottom-navigation)")
        .animationName,
    ).toBe("none");
    await transition.finished;
  },
);

test.each(["ltr", "rtl"])(
  "bottom navigation slides page content and headings in destination order (%s)",
  async (direction) => {
    await page.viewport(390, 844);
    const previousDirection = document.documentElement.dir;
    document.documentElement.dir = direction;
    onTestFinished(() => {
      document.documentElement.dir = previousDirection;
    });
    const root = createRootRoute({
      component: () => (
        <div className="app-shell__main">
          <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
          <div className="app-shell__content">
            <Outlet />
          </div>
        </div>
      ),
    });
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/music/artists"] }),
      defaultViewTransition: true,
      routeTree: root.addChildren(
        ["/", "/projects", "/music/{-$breakdown}", "/gigs/{-$breakdown}"].map((path) =>
          createRoute({
            getParentRoute: () => root,
            path,
            staticData: { title: `Title for ${path}`, subtitle: `Subtitle for ${path}` },
            component: () => <p>Content for {path}</p>,
          }),
        ),
      ),
    });
    const result = await page.renderWithProviders(<RouterProvider router={router} />);
    await expect.poll(() => router.state.status).toBe("idle");
    for (const animation of document.getAnimations()) animation.finish();
    const startTransition = vi.spyOn(document, "startViewTransition");
    onTestFinished(async () => {
      try {
        for (const entry of startTransition.mock.results) {
          if (entry.type === "return") await entry.value.finished;
        }
      } finally {
        startTransition.mockRestore();
      }
    });
    const nav = result.getByRole("navigation", { name: "Primary" });
    for (const [index, { name, type, distance }] of [
      { name: "Gigs", type: "page-forward", distance: 24 },
      { name: "Projects", type: "page-backward", distance: -24 },
    ].entries()) {
      await nav.getByRole("link", { name, exact: true }).click();
      await expect.poll(() => startTransition.mock.results.length).toBe(index + 1);
      expect(startTransition.mock.calls[index]?.[0]).toMatchObject({ types: [type] });
      const transition = startTransition.mock.results[index];
      if (transition?.type !== "return") throw new Error("Expected a page view transition");
      await transition.value.ready;
      const navigationLayer = getComputedStyle(
        document.documentElement,
        "::view-transition-group(bottom-navigation)",
      );
      const contentLayer = getComputedStyle(
        document.documentElement,
        "::view-transition-group(page-content)",
      );
      expect(Number(navigationLayer.zIndex)).toBeGreaterThan(Number(contentLayer.zIndex));
      expect(navigationLayer.animationName).toBe("none");
      expect(
        getComputedStyle(document.documentElement, "::view-transition-old(bottom-navigation)")
          .display,
      ).toBe("none");
      const effects = document
        .getAnimations()
        .map((animation) => animation.effect)
        .filter((effect): effect is KeyframeEffect => effect instanceof KeyframeEffect);
      const signedDistance = direction === "rtl" ? -distance : distance;
      for (const target of ["page-content", "page-heading"]) {
        const incoming = effects.filter(
          (effect) => effect.pseudoElement === `::view-transition-new(${target})`,
        );
        const outgoing = effects.filter(
          (effect) => effect.pseudoElement === `::view-transition-old(${target})`,
        );
        expect(incoming.map((effect) => effect.getKeyframes()[0])).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ translate: `${signedDistance}px` }),
            expect.objectContaining({ opacity: "0" }),
          ]),
        );
        expect(outgoing.map((effect) => effect.getKeyframes().at(-1))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ translate: `${-signedDistance}px` }),
            expect.objectContaining({ opacity: "0" }),
          ]),
        );
      }
      expect(effects.some((effect) => effect.pseudoElement?.includes("(root)"))).toBe(false);
      await transition.value.finished;
    }
  },
);
test("keeps subtitles paired with the deepest titled route and removes them on navigation", async () => {
  await page.viewport(390, 844);
  const root = createRootRoute({
    staticData: { title: "Site", subtitle: "Site subtitle" },
    head: () => generateMetadata({ title: "Site" }),
    component: () => (
      <>
        <HeadContent />
        <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
      </>
    ),
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    staticData: { title: "Home", subtitle: "Projects, music, and other interests" },
    head: () => generateMetadata({ title: "Home" }),
  });
  const projects = createRoute({
    getParentRoute: () => root,
    path: "/projects",
    staticData: { title: "Projects" },
    head: () => generateMetadata({ title: "Projects" }),
  });
  const music = createRoute({
    getParentRoute: () => root,
    path: "/music/{-$breakdown}",
  });
  const gigs = createRoute({
    getParentRoute: () => root,
    path: "/gigs",
    staticData: { title: "Gigs", subtitle: "" },
    head: () => generateMetadata({ title: "Gigs" }),
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: root.addChildren([home, projects, music, gigs]),
  });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const banner = result.getByRole("banner");
  const homeSubtitle = banner.getByText("Projects, music, and other interests");
  const siteSubtitle = banner.getByText("Site subtitle", { exact: true });
  const navigation = result.getByRole("navigation", { name: "Primary" });
  const currentLink = () => navigation.element().querySelectorAll('[aria-current="page"]');

  await expect.element(homeSubtitle).toBeVisible();
  await expect
    .element(navigation.getByRole("link", { name: "Home", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);
  await expect.poll(() => document.title).toBe("Home | eskimojo");
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await navigation.getByRole("link", { name: "Projects", exact: true }).click();
  await expect
    .element(navigation.getByRole("link", { name: "Projects", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);
  await expect.element(banner.getByText("Projects", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Projects | eskimojo");
  await expect.element(homeSubtitle).not.toBeInTheDocument();
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await navigation.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(navigation.getByRole("link", { name: "Music", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);
  await expect.element(banner.getByText("Site", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Site | eskimojo");
  await expect.element(siteSubtitle).toBeVisible();

  await router.navigate({ to: "/music/{-$breakdown}", params: { breakdown: "artists" } });
  await expect
    .element(navigation.getByRole("link", { name: "Music", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);

  await navigation.getByRole("link", { name: "Gigs", exact: true }).click();
  await expect
    .element(navigation.getByRole("link", { name: "Gigs", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);
  await expect.element(banner.getByText("Gigs", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Gigs | eskimojo");
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await navigation.getByRole("link", { name: "Home", exact: true }).click();
  await expect
    .element(navigation.getByRole("link", { name: "Home", exact: true }))
    .toHaveAttribute("aria-current", "page");
  expect(currentLink()).toHaveLength(1);
  await expect.element(homeSubtitle).toBeVisible();
  await expect.poll(() => document.title).toBe("Home | eskimojo");
});
