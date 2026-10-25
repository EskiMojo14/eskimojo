import { useMatches } from "@tanstack/react-router";
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
  const pageData = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.title !== undefined)?.staticData,
  });

  return (
    <>
      <header {...appBarBem({ modifiers: { "with-subtitle": Boolean(pageData?.subtitle) } })}>
        <IconButton
          {...appBarBem({ element: "navigation" })}
          icon={<MdSymbol>menu</MdSymbol>}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          onClick={onOpenNavigation}
        />
        <div {...appBarBem({ element: "text" })}>
          <span {...appBarBem({ element: "title" })}>{pageData?.title}</span>
          {pageData?.subtitle && (
            <span {...appBarBem({ element: "subtitle" })}>{pageData.subtitle}</span>
          )}
        </div>
        <IconButton
          {...appBarBem({ element: "preferences" })}
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
