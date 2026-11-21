import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

import { MdSymbol } from "#/shared/components/symbol";

import { ExternalLinkChip, FilterChip, InternalLinkChip } from "./index";

function ToggleDemo() {
  const [selected, setSelected] = useState(false);

  return (
    <FilterChip
      selected={selected}
      icon={<MdSymbol aria-label="Favourite icon">favorite</MdSymbol>}
      onClick={() => setSelected(!selected)}
    >
      Favourite
    </FilterChip>
  );
}

test("toggles with pointer and keyboard without changing its accessible name", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<ToggleDemo />);
  const chip = result.getByRole("button", { name: "Favourite", exact: true });
  await expect.element(chip).toHaveAttribute("type", "button");
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect.element(chip).toHaveAttribute("aria-pressed", "true");
  await userEvent.keyboard(" ");
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  expect(triggerHaptic).toHaveBeenCalledTimes(2);
  expect(triggerHaptic).toHaveBeenCalledWith("selection", undefined);
  await expect.element(chip).toHaveAccessibleName("Favourite");
  expect(result.getByRole("img").query()).toBeNull();
});

test("updates selected state without changing the chip's accessible name", async () => {
  const result = await page.renderWithProviders(<FilterChip selected={false}>Period</FilterChip>);
  const chip = result.getByRole("button", { name: "Period" });
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");

  await result.rerender(<FilterChip selected>Period</FilterChip>);
  await expect.element(chip).toHaveAttribute("aria-pressed", "true");

  await result.rerender(<FilterChip selected={false}>Period</FilterChip>);
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  await expect.element(chip).toHaveAccessibleName("Period");
});

test("compact chips keep 48px hit areas without enlarging their layout boxes", async () => {
  const root = document.documentElement;
  const previousDensity = root.style.getPropertyValue("--md-density");

  onTestFinished(() => {
    if (previousDensity) root.style.setProperty("--md-density", previousDensity);
    else root.style.removeProperty("--md-density");
  });

  root.style.setProperty("--md-density", "-2");

  const result = await page.renderWithProviders(<FilterChip selected={false}>X</FilterChip>);
  const chip = result.getByRole("button", { name: "X" }).element();
  const bounds = chip.getBoundingClientRect();
  const hitArea = getComputedStyle(chip, "::after");

  expect(bounds.width).toBeLessThan(48);
  expect(bounds.height).toBeLessThan(48);
  expect(Number.parseFloat(hitArea.inlineSize)).toBeGreaterThanOrEqual(48);
  expect(Number.parseFloat(hitArea.blockSize)).toBeGreaterThanOrEqual(48);
});

test("disabling haptics preserves filter changes and link navigation without feedback", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();

  const result = await page.renderWithProviders(
    <>
      <ToggleDemo />
      <InternalLinkChip to="/projects" search={{ type: "package" }}>
        Packages
      </InternalLinkChip>
    </>,
    { preferences: { haptics: "off" } },
  );

  const toggle = result.getByRole("button", { name: "Favourite" });
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
  await result.getByRole("link", { name: "Packages" }).click();
  await expect.poll(() => result.router.state.location.search.type).toBe("package");
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("link chips update their current state and preserve link semantics", async () => {
  const result = await page.renderWithProviders(
    <ExternalLinkChip href="#period" aria-current="page">
      Period
    </ExternalLinkChip>,
  );

  const chip = result.getByRole("link", { name: "Period" });
  await expect.element(chip).toHaveAttribute("aria-current", "page");
  await expect.element(chip).toHaveAttribute("target", "_blank");
  await expect.element(chip).toHaveAttribute("rel", "noopener noreferrer");

  await result.rerender(
    <ExternalLinkChip href="#period" aria-current={false}>
      Period
    </ExternalLinkChip>,
  );
  await expect.element(chip).toHaveAttribute("aria-current", "false");
  await expect.element(chip).not.toHaveAttribute("aria-pressed");
  await expect.element(chip).toHaveAccessibleName("Period");
});

test("link filters confirm query changes and clearing filters, but not unchanged destinations", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();

  const result = await page.renderWithProviders(
    <>
      <InternalLinkChip to="/projects" search={{ type: "package" }}>
        Packages
      </InternalLinkChip>
      <InternalLinkChip to="/projects" search={{}} activeOptions={{ includeSearch: false }}>
        Clear filters
      </InternalLinkChip>
    </>,
    { historyOpts: { initialEntries: ["/projects?type=package"] } },
  );

  const packages = result.getByRole("link", { name: "Packages" });
  const clear = result.getByRole("link", { name: "Clear filters" });
  await packages.click();
  expect(triggerHaptic).not.toHaveBeenCalled();

  await expect.element(clear).toHaveAttribute("aria-current", "page");
  await clear.click();
  await expect.poll(() => result.router.state.location.search.type).toBeUndefined();
  expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);

  await packages.click();
  await expect.poll(() => result.router.state.location.search.type).toBe("package");
  expect(triggerHaptic).toHaveBeenCalledTimes(2);
});

test("link filters preserve scroll when changing the query", async () => {
  const root = createRootRoute({
    component: () => (
      <div style={{ minBlockSize: "3000px" }}>
        <InternalLinkChip to="/projects" search={{ type: "package" }}>
          Packages
        </InternalLinkChip>
      </div>
    ),
  });

  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/projects"] }),
    scrollRestoration: true,
    routeTree: root.addChildren([createRoute({ getParentRoute: () => root, path: "/projects" })]),
  });

  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const packages = result.getByRole("link", { name: "Packages" }).element();

  if (!(packages instanceof HTMLAnchorElement)) throw new Error("Filter chip must be an anchor.");
  onTestFinished(() => window.scrollTo({ top: 0, behavior: "instant" }));
  window.scrollTo({ top: 200, behavior: "instant" });
  expect(window.scrollY).toBe(200);

  packages.click();

  await expect.poll(() => router.state.location.search.type).toBe("package");
  await expect.poll(() => router.state.status).toBe("idle");
  expect(window.scrollY).toBe(200);
});

test("canceled, disabled, and new-tab link filters do not produce feedback", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();

  const result = await page.renderWithProviders(
    <>
      <InternalLinkChip to="/projects" onClick={(event) => event.preventDefault()}>
        Canceled
      </InternalLinkChip>
      <InternalLinkChip to="/projects" disabled>
        Disabled
      </InternalLinkChip>
      <InternalLinkChip to="/projects" target="_blank">
        New tab
      </InternalLinkChip>
    </>,
  );

  await result.getByRole("link", { name: "Canceled" }).click();
  const disabled = result.getByRole("link", { name: "Disabled" }).element();
  expect(disabled).toHaveAttribute("aria-disabled", "true");
  disabled.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  const newTab = result.getByRole("link", { name: "New tab" }).element();
  // Suppress native navigation after the link handler runs.
  document.addEventListener("click", (event) => event.preventDefault(), { once: true });
  newTab.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  expect(triggerHaptic).not.toHaveBeenCalled();
});
