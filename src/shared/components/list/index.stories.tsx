import { useId, useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { Checkbox } from "#/shared/components/checkbox";
import { Switch } from "#/shared/components/switch";
import { MdSymbol } from "#/shared/components/symbol";

import { List, ListDivider, ListItem, ListItemContent } from "./index";

const meta = preview.meta({
  title: "Components/List",
  component: List,
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          'MD3 list primitives. Expressive is the default: vertical, connected surface-container rows with 2px gaps and larger outer corners, following the site shape tokens. Use variant="navigation" for the responsive navigation layout. ListItemContent supplies headline, optional supportingText, leading and trailing slots. Rows grow to fit wrapping content. Put content directly in ListItem for a static row, wrap it in a native link/button or TanStack Link for an action, or use a native label containing one checkbox or switch for a whole-row toggle. Do not nest interactive controls inside row links or buttons. For a leading/trailing Checkbox or Switch, omit its built-in label and supply aria-label or aria-labelledby to avoid nested labels; slotted controls need htmlFor/id for the linter. Direct row actions automatically receive pointer-origin ripples and centered keyboard feedback, including Space activation of labelled checkboxes and switches. Static rows do not ripple. Disabled controls are ignored and reduced motion uses static feedback. Give decorative images an empty alt and decorative slots aria-hidden content. Native button props control disabled and aria-pressed states. Styles load through the shared head-linked stylesheet.',
      },
    },
  },
});

export const Expressive = meta.story({
  render: () => (
    <List aria-label="Recently played" style={{ width: "min(100%, 28rem)" }}>
      <ListItem>
        <ListItemContent
          leading={<img src="/Goat-avatar.webp" alt="" width={56} height={56} />}
          headline="Let It Happen"
          supportingText="Tame Impala"
          trailing="Now playing"
        />
      </ListItem>
      <ListItem>
        <ListItemContent
          leading={<MdSymbol aria-hidden="true">music_note</MdSymbol>}
          headline="Everything In Its Right Place"
          supportingText="Radiohead"
          trailing="5 min ago"
        />
      </ListItem>
      <ListItem>
        <ListItemContent headline="A one-line row" />
      </ListItem>
    </List>
  ),
});

function InteractiveList() {
  const [saved, setSaved] = useState(false);
  return (
    <List variant="expressive" aria-label="Music actions">
      <ListItem>
        <button type="button" aria-pressed={saved} onClick={() => setSaved(!saved)}>
          <ListItemContent
            headline="Save track"
            supportingText="Add to your favourites"
            trailing={<span aria-hidden="true">{saved ? "Saved" : "+"}</span>}
          />
        </button>
      </ListItem>
      <ListItem>
        <a href="#artist">
          <ListItemContent headline="View artist" />
        </a>
      </ListItem>
      <ListItem>
        <button type="button" disabled>
          <ListItemContent headline="Unavailable track" />
        </button>
      </ListItem>
    </List>
  );
}

export const Interactive = meta.story({
  render: () => <InteractiveList />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /Save track/ });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "Unavailable track" })).toBeDisabled();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "View artist" })).toHaveFocus();
  },
});

function SwitchList() {
  const [notifications, setNotifications] = useState(false);
  const notificationsId = useId();
  const unavailableId = useId();
  return (
    <List aria-label="Notification preferences" style={{ width: "min(100%, 28rem)" }}>
      <ListItem>
        <label htmlFor={notificationsId}>
          <ListItemContent
            headline="Notifications"
            trailing={
              <Switch
                id={notificationsId}
                aria-label="Notifications"
                checked={notifications}
                onChange={(event) => setNotifications(event.currentTarget.checked)}
              />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor={unavailableId}>
          <ListItemContent
            headline="Unavailable"
            trailing={<Switch id={unavailableId} aria-label="Unavailable" disabled />}
          />
        </label>
      </ListItem>
    </List>
  );
}

export const SwitchRows = meta.story({
  render: () => <SwitchList />,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Notifications" });
    await expect(toggle).not.toBeChecked();
    const row = canvas.getByText("Notifications").closest("label");
    if (!row) throw new Error("Expected a native label row.");
    await userEvent.click(row);
    await expect(toggle).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(toggle).not.toBeChecked();
    await userEvent.click(canvas.getByText("Notifications"));
    await expect(toggle).toBeChecked();
    await expect(canvas.getByRole("switch", { name: "Unavailable" })).toBeDisabled();
  },
});

function CheckboxList() {
  const [selected, setSelected] = useState<Array<string>>(["albums"]);
  const allId = useId();
  const albumsId = useId();
  const toursId = useId();
  const unavailableId = useId();
  const options = ["albums", "tours"];

  function setOption(option: string, checked: boolean) {
    setSelected((previous) =>
      checked ? [...previous, option] : previous.filter((value) => value !== option),
    );
  }

  return (
    <List aria-label="Email subscriptions" style={{ width: "min(100%, 28rem)" }}>
      <ListItem>
        <label htmlFor={allId}>
          <ListItemContent
            headline="All updates"
            supportingText="Choose which music updates you receive."
            trailing={
              <Checkbox
                id={allId}
                aria-label="All updates"
                checked={selected.length === options.length}
                indeterminate={selected.length > 0 && selected.length < options.length}
                onChange={(event) => setSelected(event.currentTarget.checked ? options : [])}
              />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor={albumsId}>
          <ListItemContent
            headline="Album releases"
            leading={
              <Checkbox
                id={albumsId}
                aria-label="Album releases"
                checked={selected.includes("albums")}
                onChange={(event) => setOption("albums", event.currentTarget.checked)}
              />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor={toursId}>
          <ListItemContent
            headline="Tour dates"
            trailing={
              <Checkbox
                id={toursId}
                aria-label="Tour dates"
                checked={selected.includes("tours")}
                onChange={(event) => setOption("tours", event.currentTarget.checked)}
              />
            }
          />
        </label>
      </ListItem>
      <ListItem>
        <label htmlFor={unavailableId}>
          <ListItemContent
            headline="Presale access"
            supportingText="Not currently available."
            trailing={<Checkbox id={unavailableId} aria-label="Presale access" disabled />}
          />
        </label>
      </ListItem>
    </List>
  );
}

export const CheckboxRows = meta.story({
  render: () => <CheckboxList />,
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole("checkbox", { name: "All updates" });
    await expect(all).toBePartiallyChecked();
    await userEvent.click(canvas.getByText("All updates"));
    await expect(all).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Album releases" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Tour dates" })).toBeChecked();
    await userEvent.keyboard(" ");
    await expect(all).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Album releases" })).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Tour dates" })).not.toBeChecked();
    await userEvent.click(canvas.getByText("Album releases"));
    await expect(all).toBePartiallyChecked();
    await expect(canvas.getByRole("checkbox", { name: "Presale access" })).toBeDisabled();
  },
});

export const WrappingContent = meta.story({
  render: () => (
    <List variant="expressive" aria-label="Top artists" style={{ width: 260, maxWidth: "100%" }}>
      <ListItem>
        <ListItemContent
          leading={<span aria-hidden="true">1</span>}
          headline="A very long artist name that should wrap instead of being cut off"
          supportingText="Supporting text can take as much space as it needs, including at larger text sizes."
          trailing="1,234 plays"
        />
      </ListItem>
    </List>
  ),
});

export const Navigation = meta.story({
  render: () => (
    <nav aria-label="Example navigation">
      <List variant="navigation">
        <ListItem>
          <a href="#overview" aria-current="page">
            <MdSymbol size={24}>home</MdSymbol>
            <span>Overview</span>
          </a>
        </ListItem>
        <ListItem>
          <a href="#projects">
            <MdSymbol size={24}>folder</MdSymbol>
            <span>Projects</span>
          </a>
        </ListItem>
        <ListDivider />
        <ListItem>
          <a href="#music">
            <MdSymbol size={24}>music_note</MdSymbol>
            <span>Music</span>
          </a>
        </ListItem>
        <ListItem>
          <a href="#events">
            <MdSymbol size={24}>event</MdSymbol>
            <span>Events</span>
          </a>
        </ListItem>
      </List>
    </nav>
  ),
});
