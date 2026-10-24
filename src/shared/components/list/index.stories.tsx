import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { List, ListDivider, ListItem } from "./index";

const meta = preview.meta({
  title: "Components/List",
  component: List,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "MD3 list primitives for grouped navigation and content lists.",
      },
    },
  },
});

export const Navigation = meta.story({
  render: () => (
    <nav aria-label="Example navigation">
      <List>
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
