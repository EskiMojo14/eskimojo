import { Link, useMatches, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import BEMHelper from "react-bem-helper";

import { IconButton } from "#/shared/components/buttons/icon-button";
import { PreferencesDialog } from "#/shared/components/prefs/dialog";
import { links } from "#/shared/components/sidebar/groups";
import { MdSymbol } from "#/shared/components/symbol";

const appBarBem = BEMHelper("app-bar");
const destinations = links.map(({ children }) => children).flat();

export interface AppBarProps {
  navigationOpen: boolean;
  onOpenNavigation: () => void;
}

export function AppBar({ navigationOpen, onOpenNavigation }: AppBarProps) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const matchRoute = useMatchRoute();
  const selectedIndex = destinations.findIndex((destination) =>
    matchRoute({ ...destination, fuzzy: destination.to !== "/" }),
  );
  const pageData = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.title !== undefined)?.staticData,
  });

  return (
    <>
      <header {...appBarBem({ modifiers: { "with-subtitle": Boolean(pageData?.subtitle) } })}>
        <fieldset {...appBarBem({ element: "actions" })} aria-label="Page actions">
          <IconButton
            {...appBarBem({ element: "navigation" })}
            icon={<MdSymbol>menu</MdSymbol>}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={navigationOpen}
            onClick={onOpenNavigation}
          />
          <IconButton
            {...appBarBem({ element: "preferences" })}
            icon={
              <span {...appBarBem({ element: "preferences-icon" })}>
                <MdSymbol>settings</MdSymbol>
              </span>
            }
            aria-label="Preferences"
            tooltip="Preferences"
            aria-haspopup="dialog"
            aria-expanded={preferencesOpen}
            onClick={() => setPreferencesOpen(true)}
          />
        </fieldset>
        <div {...appBarBem({ element: "text" })}>
          <span {...appBarBem({ element: "title" })}>{pageData?.title}</span>
          {pageData?.subtitle && (
            <span {...appBarBem({ element: "subtitle" })}>{pageData.subtitle}</span>
          )}
        </div>
      </header>
      <nav {...appBarBem({ element: "bottom-navigation" })} aria-label="Primary">
        {destinations.map(({ label, icon, ...link }, index) => (
          <Link
            {...link}
            key={label}
            {...appBarBem({ element: "destination" })}
            activeOptions={{ exact: link.to === "/" }}
            viewTransition={
              selectedIndex < 0 || index === selectedIndex
                ? false
                : { types: [index > selectedIndex ? "page-forward" : "page-backward"] }
            }
          >
            <span {...appBarBem({ element: "destination-icon" })} aria-hidden="true">
              <MdSymbol>{icon}</MdSymbol>
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <PreferencesDialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </>
  );
}
