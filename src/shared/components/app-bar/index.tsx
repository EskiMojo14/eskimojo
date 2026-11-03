import { createLink, useMatches } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import { IconButton } from "#/shared/components/buttons/icon-button";
import { InternalLinkIconButton } from "#/shared/components/buttons/link-icon-button";
import { PreferencesDialog } from "#/shared/components/prefs/dialog";
import { useRipple } from "#/shared/components/ripple";
import { links } from "#/shared/components/sidebar/groups";
import { MdSymbol } from "#/shared/components/symbol";

const appBarBem = BEMHelper("app-bar");
const destinations = links.map(({ children }) => children).flat();

function DestinationLinkBase({
  icon,
  children,
  ...props
}: ComponentPropsWithRef<"a"> & { icon: string }) {
  const { handlers, ripple } = useRipple<HTMLAnchorElement>(props, true);
  return (
    <a {...props} {...handlers} {...appBarBem({ element: "destination" })}>
      <span {...appBarBem({ element: "destination-icon" })} aria-hidden="true">
        {ripple}
        <MdSymbol>{icon}</MdSymbol>
      </span>
      <span>{children}</span>
    </a>
  );
}

const DestinationLink = createLink(DestinationLinkBase);

/**
 * Settles a scroll that ends partway through the title collapse at whichever end is
 * nearer, so the title never rests half-morphed.
 */
function useSettleTitleCollapse() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (
      !toolbar ||
      !CSS.supports("(animation-timeline: scroll()) and (animation-range: 0% 100%)")
    ) {
      return undefined;
    }
    const settle = () => {
      // Scroll offsets can round to whole pixels, so round up to be sure the collapse finishes.
      const distance = Math.ceil(
        Number.parseFloat(
          getComputedStyle(toolbar).getPropertyValue("--app-bar-collapse-distance"),
        ),
      );
      const { scrollY } = window;
      if (scrollY <= 0 || scrollY >= distance) return;
      window.scrollTo({
        top: scrollY < distance / 2 ? 0 : distance,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    };
    window.addEventListener("scrollend", settle);
    return () => window.removeEventListener("scrollend", settle);
  }, []);
  return toolbarRef;
}

export interface AppBarProps {
  navigationOpen: boolean;
  onOpenNavigation: () => void;
}

export function AppBar({ navigationOpen, onOpenNavigation }: AppBarProps) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const toolbarRef = useSettleTitleCollapse();
  const pageData = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.title !== undefined)?.staticData,
  });
  const { label: backLabel, ...backLink } = pageData?.backLink ?? {};

  return (
    <>
      <div {...appBarBem({ element: "toolbar" })} ref={toolbarRef}>
        <span {...appBarBem({ element: "surface" })} aria-hidden="true" />
        <span {...appBarBem({ element: "small-title" })} aria-hidden="true">
          {pageData?.title}
        </span>
        <fieldset {...appBarBem({ element: "actions" })} aria-label="Page actions">
          {pageData?.backLink ? (
            <InternalLinkIconButton
              {...backLink}
              activeOptions={{ exact: true }}
              {...appBarBem({ element: "back" })}
              aria-label={backLabel ?? "Back"}
              tooltip={backLabel}
              tooltipAsLabel
              icon={<MdSymbol flipRtl>arrow_back</MdSymbol>}
            />
          ) : (
            <IconButton
              {...appBarBem({ element: "navigation" })}
              icon={<MdSymbol>menu</MdSymbol>}
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-expanded={navigationOpen}
              onClick={onOpenNavigation}
            />
          )}
          <IconButton
            {...appBarBem({ element: "preferences" })}
            icon={
              <span {...appBarBem({ element: "preferences-icon" })}>
                <MdSymbol>settings</MdSymbol>
              </span>
            }
            aria-label="Preferences"
            tooltip="Preferences"
            tooltipAsLabel
            aria-haspopup="dialog"
            aria-expanded={preferencesOpen}
            onClick={() => setPreferencesOpen(true)}
          />
        </fieldset>
      </div>
      <header
        {...appBarBem({
          element: "text",
          modifiers: { "with-subtitle": Boolean(pageData?.subtitle) },
        })}
      >
        <span {...appBarBem({ element: "title" })}>{pageData?.title}</span>
        {pageData?.subtitle && (
          <span {...appBarBem({ element: "subtitle" })}>{pageData.subtitle}</span>
        )}
      </header>
      <nav {...appBarBem({ element: "bottom-navigation" })} aria-label="Primary">
        {destinations.map(({ label, icon, ...link }) => (
          <DestinationLink
            {...link}
            key={label}
            icon={icon}
            activeOptions={{ exact: link.to === "/" }}
          >
            {label}
          </DestinationLink>
        ))}
      </nav>
      <PreferencesDialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </>
  );
}
