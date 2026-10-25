import { Link } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import BEMHelper from "react-bem-helper";

import { Button } from "#/shared/components/buttons/button";
import { Dialog } from "#/shared/components/dialog";
import { List, ListDivider, ListItem } from "#/shared/components/list";
import { usePalette } from "#/shared/components/prefs/context";
import { PreferencesDialog } from "#/shared/components/prefs/dialog";
import { MdSymbol } from "#/shared/components/symbol";

import { links } from "./groups";

const siteSidebarBem = BEMHelper("site-sidebar");

function SidebarContents({
  onOpenPreferences,
  onNavigate,
}: {
  onOpenPreferences: () => void;
  onNavigate: () => void;
}) {
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
      <div {...siteSidebarBem({ element: "preferences" })}>
        <Button
          variant="text"
          icon={<MdSymbol>settings</MdSymbol>}
          aria-haspopup="dialog"
          onClick={onOpenPreferences}
        >
          Preferences
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <>
      <header {...siteSidebarBem({ element: "mobile-header" })}>
        <Button
          variant="text"
          icon={<MdSymbol>menu</MdSymbol>}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          onClick={() => setNavigationOpen(true)}
        />
        <span {...siteSidebarBem({ element: "mobile-title" })}>eskimojo</span>
      </header>
      <aside {...siteSidebarBem({ modifier: "desktop" })} aria-label="Primary navigation">
        <SidebarContents
          onOpenPreferences={() => setPreferencesOpen(true)}
          onNavigate={() => setNavigationOpen(false)}
        />
      </aside>
      <Dialog
        open={navigationOpen}
        className="site-sidebar__dialog"
        aria-label="Primary navigation"
        onClose={() => setNavigationOpen(false)}
      >
        <aside {...siteSidebarBem({ modifier: "modal-content" })}>
          <SidebarContents
            onOpenPreferences={() => setPreferencesOpen(true)}
            onNavigate={() => setNavigationOpen(false)}
          />
        </aside>
      </Dialog>
      <PreferencesDialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </>
  );
}
