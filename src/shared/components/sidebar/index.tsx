import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import BEMHelper from "react-bem-helper";

import { Dialog } from "#/shared/components/dialog";
import { List, ListDivider, ListItem } from "#/shared/components/list";
import { usePalette } from "#/shared/components/prefs/context";
import { MdSymbol } from "#/shared/components/symbol";

import { links } from "./groups";

const siteSidebarBem = BEMHelper("site-sidebar");

function SidebarContents({ onNavigate }: { onNavigate: () => void }) {
  const { palette, setPalette } = usePalette();
  const nextPalette = palette === "goat" ? "arctic" : "goat";
  const nextPaletteLabel = nextPalette === "goat" ? "Goat" : "Arctic";
  return (
    <>
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
                  <Link {...link} onClick={onNavigate}>
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
    </>
  );
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside {...siteSidebarBem({ modifier: "desktop" })} aria-label="Primary navigation">
        <SidebarContents onNavigate={onClose} />
      </aside>
      <Dialog
        open={open}
        className="site-sidebar__dialog"
        aria-label="Primary navigation"
        onClose={onClose}
      >
        <aside {...siteSidebarBem({ modifier: "modal-content" })}>
          <SidebarContents onNavigate={onClose} />
        </aside>
      </Dialog>
    </>
  );
}
