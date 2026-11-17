import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Switch } from "#/shared/components/switch";

import { List, ListItem, ListItemContent } from "./index";

test("renders semantic static rows and optional content", async () => {
  const result = await page.renderWithProviders(
    <List aria-label="Recent tracks">
      <ListItem>
        <ListItemContent
          headline="Let It Happen"
          supportingText="Tame Impala"
          leading={<img src="/Goat-avatar.webp" alt="" />}
          trailing="Now playing"
        />
      </ListItem>
      <ListItem>
        <ListItemContent headline="Another track" />
      </ListItem>
    </List>,
  );
  await expect.element(result.getByRole("list", { name: "Recent tracks" })).toBeVisible();
  expect(result.getByRole("listitem").all()).toHaveLength(2);
  await expect.element(result.getByText("Tame Impala")).toBeVisible();
  await expect.element(result.getByText("Now playing")).toBeVisible();
  expect(result.getByRole("button").query()).toBeNull();
});

test("keeps row actions native and respects disabled buttons", async () => {
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <List variant="expressive">
      <ListItem>
        <button type="button" onClick={onClick} disabled>
          <ListItemContent headline="Save track" />
        </button>
      </ListItem>
      <ListItem>
        <a href="#artist">
          <ListItemContent headline="View artist" />
        </a>
      </ListItem>
    </List>,
  );
  await expect.element(result.getByRole("button", { name: "Save track" })).toBeDisabled();
  await expect
    .element(result.getByRole("link", { name: "View artist" }))
    .toHaveAttribute("href", "#artist");
  expect(onClick).not.toHaveBeenCalled();
});

test("preserves the existing navigation API", async () => {
  const result = await page.renderWithProviders(
    <nav aria-label="Main">
      <List variant="navigation">
        <ListItem>
          <a href="#music" aria-current="page">
            Music
          </a>
        </ListItem>
      </List>
    </nav>,
  );
  await expect
    .element(result.getByRole("link", { name: "Music" }))
    .toHaveAttribute("aria-current", "page");
});

test("switch rows toggle once from empty space, either edge, and the keyboard", async () => {
  const onChange = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <List style={{ width: 320 }}>
      <ListItem>
        <label htmlFor="list-notifications">
          <ListItemContent
            headline="Notifications"
            trailing={
              <Switch id="list-notifications" aria-label="Notifications" onChange={onChange} />
            }
          />
        </label>
      </ListItem>
    </List>,
  );
  const row = result.getByRole("listitem");
  const toggle = result.getByRole("switch", { name: "Notifications" });
  await row.click({ position: { x: 160, y: 36 } });
  await expect.element(toggle).toBeChecked();
  await row.click({ position: { x: 4, y: 36 } });
  await expect.element(toggle).not.toBeChecked();
  await row.click({ position: { x: 316, y: 36 } });
  await expect.element(toggle).toBeChecked();
  await toggle.click();
  await expect.element(toggle).not.toBeChecked();
  await expect.element(toggle).toHaveFocus();
  await userEvent.keyboard(" ");
  await expect.element(toggle).toBeChecked();
  expect(onChange).toHaveBeenCalledTimes(5);
});
