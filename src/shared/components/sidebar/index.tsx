import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import { List, ListDivider, ListItem } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";
import { createBem } from "#/shared/lib/bem";

import { links } from "./groups";

const siteSidebarBem = createBem("site-sidebar");

export function Sidebar() {
  return (
    <aside {...siteSidebarBem()} aria-label="Sidebar">
      <nav aria-label="Primary">
        <List>
          {links.map(({ key, children }, groupIndex) => (
            <Fragment key={key}>
              {children.map(({ icon, label, ...link }) => (
                <ListItem key={label}>
                  <Link {...link}>
                    <MdSymbol size={24}>{icon}</MdSymbol>
                    <span>{label}</span>
                  </Link>
                </ListItem>
              ))}
              {groupIndex < links.length - 1 && <ListDivider />}
            </Fragment>
          ))}
        </List>
      </nav>
    </aside>
  );
}
