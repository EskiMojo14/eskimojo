import { Link } from "@tanstack/react-router";
import { createRef } from "react";
import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";
import { ExternalLinkButton } from "#/shared/components/buttons/link-button";
import { ExternalLinkIconButton } from "#/shared/components/buttons/link-icon-button";
import {
  AssistChip,
  FilterChip,
  ExternalLinkChip,
  InternalLinkChip,
} from "#/shared/components/chips";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { Tab, TabLink, TabList, TabNav, Tabs } from "#/shared/components/tabs";

function press(element: Element, x = 8, y = 8, pointerId = 1) {
  const rect = element.getBoundingClientRect();
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      button: 0,
      pointerId,
      clientX: rect.left + x,
      clientY: rect.top + y,
    }),
  );
}

function wave(element: Element) {
  const node = element.querySelector(".ripple__wave");
  if (!(node instanceof HTMLSpanElement)) throw new Error("Expected an active ripple wave");
  return node;
}

test("chips and interactive list rows ripple without changing static rows or event behavior", async () => {
  const ref = createRef<HTMLButtonElement>();
  const onPointerDown = vi.fn<() => void>();
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <>
      <AssistChip>Assist</AssistChip>
      <FilterChip selected={false}>Filter</FilterChip>
      <ExternalLinkChip href="#external">External chip</ExternalLinkChip>
      <InternalLinkChip to="/projects">Internal chip</InternalLinkChip>
      <List>
        <ListItem>
          <button ref={ref} type="button" onPointerDown={onPointerDown} onClick={onClick}>
            <ListItemContent headline="Row action" />
          </button>
        </ListItem>
        <ListItem>
          <a href="#row">
            <ListItemContent headline="Row link" />
          </a>
        </ListItem>
        <ListItem>
          <button disabled>
            <ListItemContent headline="Disabled row" />
          </button>
        </ListItem>
        <ListItem>
          <ListItemContent headline="Static row" />
        </ListItem>
      </List>
      <List variant="navigation">
        <ListItem>
          <Link to="/projects">Projects navigation</Link>
        </ListItem>
      </List>
      <Tabs defaultValue="first">
        <TabList aria-label="Ripple tabs">
          <Tab value="first">First tab</Tab>
        </TabList>
      </Tabs>
      <TabNav aria-label="Ripple navigation">
        <TabLink to="/projects">Projects tab link</TabLink>
      </TabNav>
    </>,
  );
  for (const [role, name] of [
    ["button", "Assist"],
    ["button", "Filter"],
    ["link", "External chip"],
    ["link", "Internal chip"],
    ["button", "Row action"],
    ["link", "Row link"],
    ["link", "Projects navigation"],
    ["tab", "First tab"],
    ["link", "Projects tab link"],
  ] as const) {
    const element = result.getByRole(role, { name, exact: true }).element();
    press(element);
    expect(element.querySelectorAll(".ripple")).toHaveLength(1);
    const rect = element.getBoundingClientRect();
    const layer = element.querySelector(".ripple")?.getBoundingClientRect();
    if (!layer) throw new Error("Expected a ripple layer");
    expect(
      Math.abs(
        wave(element).offsetLeft + wave(element).offsetWidth / 2 - (rect.left + 8 - layer.left),
      ),
    ).toBeLessThanOrEqual(1);
    await expect.element(result.getByRole(role, { name, exact: true })).toHaveAccessibleName(name);
    document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 }));
    expect(element.querySelector(".ripple__wave")).toBeNull();
  }
  expect(onPointerDown).toHaveBeenCalledOnce();
  const row = result.getByRole("button", { name: "Row action" });
  expect(ref.current).toBe(row.element());
  const previous = result.getByRole("link", { name: "Row link" }).element();
  if (!(previous instanceof HTMLElement)) throw new Error("Expected a focusable link");
  previous.focus();
  press(row.element());
  ref.current?.focus();
  expect(wave(row.element()).isConnected).toBe(true);
  window.dispatchEvent(new Event("blur"));
  expect(row.element().querySelector(".ripple__wave")).toBeNull();
  await row.click();
  expect(onClick).toHaveBeenCalledOnce();
  const disabled = result.getByRole("button", { name: "Disabled row" }).element();
  press(disabled);
  expect(disabled.querySelector(".ripple__wave")).toBeNull();
  expect(
    result.getByText("Static row").element().closest("li")?.querySelector(".ripple"),
  ).toBeNull();
  await expect
    .element(result.getByRole("link", { name: "Projects navigation" }))
    .toHaveAttribute("href", "/projects");
});

test("tab ripples preserve keyboard selection, disabled states, and prevented events", async () => {
  const onKeyDown = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Tabs defaultValue="first">
      <TabList aria-label="Keyboard tabs">
        <Tab value="first" onKeyDown={onKeyDown}>
          First
        </Tab>
        <Tab value="disabled" disabled>
          Disabled
        </Tab>
        <Tab value="aria-disabled" aria-disabled="true">
          Unavailable
        </Tab>
        <Tab value="last" onPointerDown={(event) => event.preventDefault()}>
          Last
        </Tab>
      </TabList>
    </Tabs>,
  );
  await userEvent.tab();
  const first = result.getByRole("tab", { name: "First" });
  await userEvent.keyboard("{Space>}");
  const ripple = wave(first.element());
  const bounds = first.element().querySelector(".ripple")?.getBoundingClientRect();
  if (!bounds) throw new Error("Expected a ripple layer");
  expect(
    Math.abs(ripple.offsetLeft + ripple.offsetWidth / 2 - bounds.width / 2),
  ).toBeLessThanOrEqual(1);
  expect(onKeyDown).toHaveBeenCalledOnce();
  await userEvent.keyboard("{/Space}");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("tab", { name: "Last" })).toHaveFocus();
  await expect
    .element(result.getByRole("tab", { name: "Last" }))
    .toHaveAttribute("aria-selected", "true");
  for (const name of ["Disabled", "Unavailable", "Last"]) {
    const tab = result.getByRole("tab", { name }).element();
    press(tab);
    expect(tab.querySelector(".ripple__wave")).toBeNull();
  }
});

test("chips and list actions show unbounded keyboard ripples and retain controlled selection", async () => {
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <>
      <FilterChip selected onClick={onClick}>
        Keyboard chip
      </FilterChip>
      <List>
        <ListItem>
          <button type="button" onClick={onClick}>
            Keyboard row
          </button>
        </ListItem>
        <ListItem>
          <button type="button" onPointerDown={(event) => event.preventDefault()}>
            Prevented row
          </button>
        </ListItem>
      </List>
    </>,
  );
  for (const name of ["Keyboard chip", "Keyboard row"]) {
    const control = result.getByRole("button", { name });
    await userEvent.tab();
    await userEvent.keyboard("{Space>}");
    const ripple = wave(control.element());
    const bounds = control.element().querySelector(".ripple")?.getBoundingClientRect();
    if (!bounds) throw new Error("Expected a ripple layer");
    expect(
      Math.abs(ripple.offsetLeft + ripple.offsetWidth / 2 - bounds.width / 2),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(ripple.offsetTop + ripple.offsetHeight / 2 - bounds.height / 2),
    ).toBeLessThanOrEqual(1);
    await userEvent.keyboard("{/Space}");
  }
  expect(onClick).toHaveBeenCalledTimes(2);
  await expect
    .element(result.getByRole("button", { name: "Keyboard chip" }))
    .toHaveAttribute("aria-pressed", "true");
  const prevented = result.getByRole("button", { name: "Prevented row" }).element();
  press(prevented);
  expect(prevented.querySelector(".ripple__wave")).toBeNull();
});

test("labelled buttons and links originate at the pointer; icon controls use unbounded ripples", async () => {
  const result = await page.renderWithProviders(
    <>
      <Button size="large">Action</Button>
      <ExternalLinkButton href="#project" size="large">
        Project
      </ExternalLinkButton>
      <IconButton size="large" aria-label="Favorite" icon={<svg />} />
      <ExternalLinkIconButton
        href="#project"
        size="large"
        aria-label="Icon project"
        icon={<svg />}
      />
    </>,
  );
  for (const [role, name, unbounded] of [
    ["button", "Action", false],
    ["link", "Project", false],
    ["button", "Favorite", true],
    ["link", "Icon project", true],
  ] as const) {
    const element = result.getByRole(role, { name, exact: true }).element();
    const layer = element.querySelector(".ripple");
    if (!layer) throw new Error("Expected a ripple layer");
    const rect = layer.getBoundingClientRect();
    const hostRect = element.getBoundingClientRect();
    press(element);
    const ripple = wave(element);
    expect(
      Math.abs(
        ripple.offsetLeft +
          ripple.offsetWidth / 2 -
          (unbounded ? rect.width / 2 : hostRect.left + 8 - rect.left),
      ),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        ripple.offsetTop +
          ripple.offsetHeight / 2 -
          (unbounded ? rect.height / 2 : hostRect.top + 8 - rect.top),
      ),
    ).toBeLessThanOrEqual(1);
    expect(ripple.getAnimations()).toHaveLength(2);
    document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 }));
    expect(element.querySelector(".ripple__wave")).toBeNull();
  }
});

test("holds until release and cleans up after fading, even when released outside", async () => {
  const result = await page.renderWithProviders(<Button>Hold</Button>);
  const button = result.getByRole("button", { name: "Hold" }).element();
  press(button);
  const ripple = wave(button);
  ripple.getAnimations()[0]?.finish();
  expect(button.contains(ripple)).toBe(true);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
  expect(ripple.getAnimations()).toHaveLength(2);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
  expect(ripple.getAnimations()).toHaveLength(3);
  expect(ripple.getAnimations()[2]?.effect?.getTiming().duration).toBe(375);
  for (const animation of ripple.getAnimations()) animation.finish();
  await expect.poll(() => button.querySelector(".ripple__wave")).toBeNull();
});

test("preserves ripple timings when production CSS expresses durations in seconds", async () => {
  const result = await page.renderWithProviders(<Button>Production ripple</Button>);
  const button = result.getByRole("button", { name: "Production ripple" }).element();
  if (!(button instanceof HTMLElement)) throw new Error("Expected a button element");
  button.style.setProperty("--md-comp-ripple-grow-duration", ".45s");
  button.style.setProperty("--md-comp-ripple-fade-in-duration", ".105s");
  button.style.setProperty("--md-comp-ripple-fade-duration", ".375s");
  button.style.setProperty("--md-comp-ripple-minimum-press-duration", ".225s");
  const now = vi.spyOn(performance, "now").mockReturnValue(100);
  onTestFinished(() => now.mockRestore());
  press(button);
  const ripple = wave(button);
  const [grow, fadeIn] = ripple.getAnimations();
  expect(grow?.effect?.getTiming().duration).toBe(450);
  expect(fadeIn?.effect?.getTiming().duration).toBe(105);
  now.mockReturnValue(150);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
  const fade = ripple.getAnimations()[2];
  expect(fade?.effect?.getTiming().duration).toBe(375);
  expect(fade?.effect?.getTiming().delay).toBe(175);
  for (const animation of ripple.getAnimations()) animation.finish();
  await expect.poll(() => button.querySelector(".ripple__wave")).toBeNull();
});

test("matches Material Web's soft edge, initial size, centreward growth, and fade-in", async () => {
  const result = await page.renderWithProviders(<Button size="large">Soft ripple</Button>);
  const button = result.getByRole("button", { name: "Soft ripple" }).element();
  press(button);
  const ripple = wave(button);
  const layer = button.querySelector(".ripple");
  if (!layer) throw new Error("Expected a ripple layer");
  const bounds = layer.getBoundingClientRect();
  const initialSize = Math.floor(Math.max(bounds.width, bounds.height) * 0.2);
  expect(ripple.offsetWidth).toBe(initialSize);
  expect(getComputedStyle(ripple).backgroundImage).toContain("radial-gradient");
  const [grow, fadeIn] = ripple.getAnimations();
  if (!grow || !fadeIn) throw new Error("Expected growth and fade-in animations");
  grow.pause();
  fadeIn.pause();
  grow.currentTime = 0;
  fadeIn.currentTime = 0;
  expect(getComputedStyle(ripple).opacity).toBe("0");
  expect(fadeIn.effect?.getTiming().duration).toBe(105);
  expect(grow.effect?.getTiming().easing).toBe("cubic-bezier(0.2, 0, 0, 1)");
  grow.currentTime = 450;
  fadeIn.currentTime = 105;
  const transform = new DOMMatrixReadOnly(getComputedStyle(ripple).transform);
  expect(
    Math.abs(ripple.offsetLeft + initialSize / 2 + transform.m41 - bounds.width / 2),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(ripple.offsetTop + initialSize / 2 + transform.m42 - bounds.height / 2),
  ).toBeLessThanOrEqual(1);
  const expectedDiameter =
    Math.hypot(bounds.width, bounds.height) +
    10 +
    Math.max(Math.max(bounds.width, bounds.height) * 0.35, 75);
  expect(transform.a * initialSize).toBeCloseTo(expectedDiameter, 2);
  expect(getComputedStyle(ripple).opacity).toBe("1");
  document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 }));
});

test("keyboard feedback is unbounded and preserves callbacks, refs, and native activation", async () => {
  const ref = createRef<HTMLButtonElement>();
  const onClick = vi.fn<() => void>();
  const onKeyDown = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Button ref={ref} onClick={onClick} onKeyDown={onKeyDown}>
      Keyboard
    </Button>,
  );
  const button = result.getByRole("button", { name: "Keyboard" });
  await userEvent.tab();
  await userEvent.keyboard("{Space>}");
  const ripple = wave(button.element());
  const layer = button.element().querySelector(".ripple");
  if (!layer) throw new Error("Expected a ripple layer");
  expect(
    Math.abs(ripple.offsetLeft + ripple.offsetWidth / 2 - layer.getBoundingClientRect().width / 2),
  ).toBeLessThanOrEqual(1);
  await userEvent.keyboard("{/Space}");
  expect(onClick).toHaveBeenCalledOnce();
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(ref.current).toBe(button.element());
  await expect.element(button).toHaveAccessibleName("Keyboard");
});

test("ignores disabled, aria-disabled, secondary, and prevented presses", async () => {
  const result = await page.renderWithProviders(
    <>
      <Button disabled>Disabled</Button>
      <Button aria-disabled="true">ARIA disabled</Button>
      <Button onPointerDown={(event) => event.preventDefault()}>Prevented</Button>
      <Button onKeyDown={(event) => event.preventDefault()}>Prevented keyboard</Button>
    </>,
  );
  for (const name of ["Disabled", "ARIA disabled", "Prevented"]) {
    const element = result.getByRole("button", { name, exact: true }).element();
    press(element);
    expect(element.querySelector(".ripple__wave")).toBeNull();
  }
  const button = result.getByRole("button", { name: "Prevented keyboard" }).element();
  button.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 2, isPrimary: true }),
  );
  button.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
  );
  expect(button.querySelector(".ripple__wave")).toBeNull();
});

test("cleans up interrupted presses, replaced waves, disabling, and unmount", async () => {
  const result = await page.renderWithProviders(<Button>Action</Button>);
  const button = result.getByRole("button", { name: "Action" }).element();
  press(button);
  const first = wave(button);
  press(button);
  expect(first.isConnected).toBe(false);
  expect(first.getAnimations()).toHaveLength(0);
  window.dispatchEvent(new Event("blur"));
  expect(button.querySelector(".ripple__wave")).toBeNull();
  press(button);
  await result.rerender(<Button disabled>Action</Button>);
  expect(button.querySelector(".ripple__wave")).toBeNull();
  await result.rerender(<Button>Action</Button>);
  press(button);
  const last = wave(button);
  await result.unmount();
  expect(last.getAnimations()).toHaveLength(0);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
});

test("reduced motion uses static pressed feedback without animations", async () => {
  const original = window.matchMedia.bind(window);
  const mock = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const result = original(query);
    if (query === "(prefers-reduced-motion: reduce)") {
      Object.defineProperty(result, "matches", { value: true });
    }
    return result;
  });
  onTestFinished(() => mock.mockRestore());
  const result = await page.renderWithProviders(<Button>Reduced motion</Button>);
  const button = result.getByRole("button", { name: "Reduced motion" }).element();
  press(button);
  expect(wave(button).getAnimations()).toHaveLength(0);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
  expect(button.querySelector(".ripple__wave")).toBeNull();
});
