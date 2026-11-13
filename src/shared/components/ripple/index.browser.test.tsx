import { Link } from "@tanstack/react-router";
import { createRef } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { SocialLink } from "#/routes/_home/-components/social-link";
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

function press(element: Element, x = 8, y = 8, pointerId = 1, button = 0) {
  const rect = element.getBoundingClientRect();
  return element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      button,
      pointerType: "mouse",
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
        <TabLink id="ripple-projects-tab" panelId="ripple-projects-panel" to="/projects">
          Projects tab link
        </TabLink>
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
    ["tab", "Projects tab link"],
  ] as const) {
    const element = result.getByRole(role, { name, exact: true }).element();
    press(element);
    expect(element.querySelectorAll(".ripple")).toHaveLength(1);
    expect(wave(element).isConnected).toBe(true);
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
  expect(wave(first.element()).isConnected).toBe(true);
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
    expect(wave(control.element()).isConnected).toBe(true);
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

test("labelled buttons, links, and icon controls ripple on press", async () => {
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
  for (const [role, name] of [
    ["button", "Action"],
    ["link", "Project"],
    ["button", "Favorite"],
    ["link", "Icon project"],
  ] as const) {
    const element = result.getByRole(role, { name, exact: true }).element();
    press(element);
    expect(wave(element).isConnected).toBe(true);
    document.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 }));
    expect(element.querySelector(".ripple__wave")).toBeNull();
  }
});

test("middle presses ripple on links without preventing navigation or affecting buttons", async () => {
  const result = await page.renderWithProviders(
    <>
      <SocialLink name="Social" handle="@social" href="https://example.com" icon={<svg />} />
      <ExternalLinkButton href="#project">Project</ExternalLinkButton>
      <ExternalLinkButton href="#disabled" aria-disabled="true">
        Disabled link
      </ExternalLinkButton>
      <ExternalLinkButton href="#prevented" onPointerDown={(event) => event.preventDefault()}>
        Prevented link
      </ExternalLinkButton>
      <Button>Action</Button>
    </>,
  );
  for (const name of ["Social profile, @social, opens in a new tab", "Project"]) {
    const link = result.getByRole("link", { name }).element();
    expect(press(link, 8, 8, 1, 1)).toBe(true);
    const ripple = wave(link);
    document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    for (const animation of ripple.getAnimations()) animation.finish();
    await expect.poll(() => link.querySelector(".ripple__wave")).toBeNull();
    press(link, 8, 8, 1, 2);
    expect(link.querySelector(".ripple__wave")).toBeNull();
  }
  for (const [role, name] of [
    ["link", "Disabled link"],
    ["link", "Prevented link"],
    ["button", "Action"],
  ] as const) {
    const element = result.getByRole(role, { name }).element();
    press(element, 8, 8, 1, 1);
    expect(element.querySelector(".ripple__wave")).toBeNull();
  }
});

test("holds until release and cleans up after fading, even when released outside", async () => {
  const result = await page.renderWithProviders(<Button>Hold</Button>);
  const button = result.getByRole("button", { name: "Hold" }).element();
  press(button);
  const ripple = wave(button);
  for (const animation of ripple.getAnimations()) animation.finish();
  expect(button.contains(ripple)).toBe(true);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
  expect(button.contains(ripple)).toBe(true);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
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
  using now = vi.spyOn(performance, "now").mockReturnValue(100);
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
  expect(wave(button.element()).isConnected).toBe(true);
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
  using matchMedia = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const result = original(query);
    if (query === "(prefers-reduced-motion: reduce)") {
      Object.defineProperty(result, "matches", { value: true });
    }
    return result;
  });
  const result = await page.renderWithProviders(<Button>Reduced motion</Button>);
  const button = result.getByRole("button", { name: "Reduced motion" }).element();
  press(button);
  expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  expect(wave(button).getAnimations()).toHaveLength(0);
  document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
  expect(button.querySelector(".ripple__wave")).toBeNull();
});
