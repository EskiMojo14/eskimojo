import { Link } from "@tanstack/react-router";
import { Fragment, type ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { Dialog } from "#/shared/components/dialog";
import { List, ListDivider, ListItem } from "#/shared/components/list";
import { usePalette } from "#/shared/components/prefs/context";
import { useRipple } from "#/shared/components/ripple";
import { MdSymbol } from "#/shared/components/symbol";
import { withTooltip } from "#/shared/components/tooltip";

import { links } from "./groups";

const siteSidebarBem = BEMHelper("site-sidebar");

const PaletteToggle = withTooltip(function PaletteToggle(props: ComponentPropsWithRef<"button">) {
  return <button {...props} />;
});

function SidebarContents({ onNavigate }: { onNavigate: () => void }) {
  const { palette, setPalette } = usePalette();
  const { handlers, ripple } = useRipple<HTMLButtonElement>(undefined, true);
  const nextPalette = palette === "goat" ? "arctic" : "goat";
  const nextPaletteLabel = nextPalette === "goat" ? "Goat" : "Arctic";
  return (
    <>
      <div {...siteSidebarBem({ element: "header" })}>
        <PaletteToggle
          {...handlers}
          {...siteSidebarBem({ element: "palette-toggle" })}
          type="button"
          tooltip={`Switch to ${nextPaletteLabel} palette`}
          tooltipAsLabel
          onClick={() => setPalette(nextPalette)}
        >
          {ripple}
          <span
            {...siteSidebarBem({ element: "palette-track" })}
            data-palette={palette}
            aria-hidden="true"
          >
            <img
              {...siteSidebarBem({ element: "palette-avatar" })}
              src="/Goat-avatar.webp"
              alt=""
              draggable={false}
            />
            <img
              {...siteSidebarBem({ element: "palette-avatar" })}
              src="/OC-avatar.webp"
              alt=""
              draggable={false}
            />
          </span>
        </PaletteToggle>
        <h1 {...siteSidebarBem({ element: "title" })}>eskimojo</h1>
      </div>
      <nav aria-label="Primary">
        <List variant="navigation">
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
