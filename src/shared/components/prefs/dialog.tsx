import { useRef, useState } from "react";
import BEMHelper from "react-bem-helper";
import { flushSync } from "react-dom";

import { Button } from "#/shared/components/buttons/button";
import { Dialog, DialogContent, type DialogProps } from "#/shared/components/dialog";
import { Tab, TabList, Tabs } from "#/shared/components/tabs";

import { OtherPanel } from "./panels/other";
import { SyntaxPanel } from "./panels/syntax";
import { ThemePanel } from "./panels/theme";

const preferencesBem = BEMHelper("preferences-dialog");
const preferenceTabs = ["theme", "syntax", "other"];

export type PreferencesDialogProps = Pick<DialogProps, "open" | "onClose">;

export function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const [tab, setTab] = useState("theme");
  const panelsRef = useRef<
    HTMLDivElement & { startViewTransition?: Document["startViewTransition"] }
  >(null);

  function selectTab(nextTab: string) {
    const panels = panelsRef.current;
    if (
      !panels?.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTab(nextTab);
      return;
    }

    const transition = panels.startViewTransition({
      types: [
        preferenceTabs.indexOf(nextTab) > preferenceTabs.indexOf(tab)
          ? "tab-forward"
          : "tab-backward",
      ],
      update: () => flushSync(() => setTab(nextTab)),
    });
    void transition.ready.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Could not animate the preferences tab change.", error);
    });
  }

  return (
    <Dialog open={open} onClose={onClose} className="preferences-dialog-modal">
      {({ close }) => (
        <DialogContent
          title="Preferences"
          description="Changes are saved automatically."
          actions={
            <Button variant="text" onClick={() => close()}>
              Done
            </Button>
          }
        >
          <Tabs {...preferencesBem()} value={tab} onValueChange={selectTab}>
            <TabList aria-label="Preferences">
              <Tab value="theme">Theme</Tab>
              <Tab value="syntax">Syntax</Tab>
              <Tab value="other">Other</Tab>
            </TabList>
            <div {...preferencesBem({ element: "panels" })} ref={panelsRef}>
              <div {...preferencesBem({ element: "panel-content" })}>
                <ThemePanel />
                <SyntaxPanel />
                <OtherPanel />
              </div>
            </div>
          </Tabs>
        </DialogContent>
      )}
    </Dialog>
  );
}
