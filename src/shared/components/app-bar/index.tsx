import { useState } from "react";
import BEMHelper from "react-bem-helper";

import { IconButton } from "#/shared/components/buttons/icon-button";
import { PreferencesDialog } from "#/shared/components/prefs/dialog";
import { MdSymbol } from "#/shared/components/symbol";

const appBarBem = BEMHelper("app-bar");

export interface AppBarProps {
  navigationOpen: boolean;
  onOpenNavigation: () => void;
}

export function AppBar({ navigationOpen, onOpenNavigation }: AppBarProps) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <>
      <header {...appBarBem()}>
        <IconButton
          {...appBarBem({ element: "navigation" })}
          icon={<MdSymbol>menu</MdSymbol>}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          onClick={onOpenNavigation}
        />
        <span {...appBarBem({ element: "title" })}>eskimojo</span>
        <IconButton
          icon={<MdSymbol>settings</MdSymbol>}
          aria-label="Preferences"
          tooltip="Preferences"
          aria-haspopup="dialog"
          onClick={() => setPreferencesOpen(true)}
        />
      </header>
      <PreferencesDialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </>
  );
}
