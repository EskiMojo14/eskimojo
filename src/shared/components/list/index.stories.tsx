import preview from "#.storybook/preview";
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
          'MD3 list primitives. Expressive is the default: vertical, connected surface-container rows with 2px gaps and larger outer corners, following the site shape tokens. Use variant="navigation" for the responsive navigation layout. ListItemContent supplies headline, optional supportingText, leading and trailing slots. Rows grow to fit wrapping content. Put content directly in ListItem for a static row, or wrap it in a native link/button for interaction; do not nest interactive controls inside a row action. Give decorative images an empty alt and decorative slots aria-hidden content. Native button props control disabled and aria-pressed states. Styles load through the shared head-linked stylesheet.',
      },
    },
  },
});

export const Expressive = meta.story({
  render: () => (
    <List aria-label="Recently played" style={{ width: "min(100%, 28rem)" }}>
      <ListItem>
        <ListItemContent
          leading={<img src="/Goat_square-1.jpeg" alt="" width={56} height={56} />}
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
import { useState } from "react";
import { expect } from "storybook/test";
