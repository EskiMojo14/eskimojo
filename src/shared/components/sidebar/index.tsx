import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import BEMHelper from "react-bem-helper";

import { List, ListDivider, ListItem } from "#/shared/components/list";
import { usePalette } from "#/shared/components/prefs/context";
import { MdSymbol } from "#/shared/components/symbol";

import { links } from "./groups";

const siteSidebarBem = BEMHelper("site-sidebar");

export function Sidebar() {
  const { palette, setPalette } = usePalette();
  const nextPalette = palette === "goat" ? "arctic" : "goat";
  const nextPaletteLabel = nextPalette === "goat" ? "Goat" : "Arctic";

  return (
    <aside {...siteSidebarBem()} aria-label="Sidebar">
      <div {...siteSidebarBem({ element: "header" })}>
        <button
          {...siteSidebarBem({ element: "palette-toggle" })}
          type="button"
          aria-label={`Switch to ${nextPaletteLabel} palette`}
          title={`Switch to ${nextPaletteLabel} palette`}
          onClick={() => setPalette(nextPalette)}
        >
          <img
            {...siteSidebarBem({ element: "palette-avatar" })}
            src={palette === "goat" ? "/Goat_square-1.jpeg" : "/OC__square.png"}
            alt=""
          />
        </button>
        <h1 {...siteSidebarBem({ element: "title" })}>eskimojo</h1>
      </div>
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
