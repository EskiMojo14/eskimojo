import { useId } from "react";
import BEMHelper from "react-bem-helper";

import { Button } from "#/shared/components/button";
import { ButtonGroup } from "#/shared/components/button-group";
import { Dialog, DialogContent, type DialogProps } from "#/shared/components/dialog";
import { MdSymbol } from "#/shared/components/symbol";
import {
  themeSchema,
  themeLabels,
  contrastSchema,
  contrastLabels,
  paletteSchema,
  paletteLabels,
} from "#/shared/constants/prefs";

import { useTheme, useContrast, usePalette } from "./context";

const preferencesBem = BEMHelper("preferences-dialog");

export type PreferencesDialogProps = Pick<DialogProps, "open" | "onClose">;

export function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const { theme, setTheme } = useTheme();
  const { contrast, setContrast } = useContrast();
  const { palette, setPalette } = usePalette();
  const themeId = useId();
  const contrastId = useId();
  const paletteId = useId();

  return (
    <Dialog open={open} onClose={onClose}>
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
          <div {...preferencesBem()}>
            <section {...preferencesBem({ element: "section" })} aria-labelledby={themeId}>
              <h3 {...preferencesBem({ element: "label" })} id={themeId}>
                Theme
              </h3>
              <ButtonGroup variant="connected" aria-labelledby={themeId}>
                {themeSchema.options.map((value) => (
                  <Button
                    key={value}
                    variant="tonal"
                    icon={<MdSymbol>{themeLabels[value].icon}</MdSymbol>}
                    aria-pressed={theme === value}
                    onClick={() => setTheme(value)}
                  >
                    {themeLabels[value].label}
                  </Button>
                ))}
              </ButtonGroup>
            </section>
            <section {...preferencesBem({ element: "section" })} aria-labelledby={contrastId}>
              <h3 {...preferencesBem({ element: "label" })} id={contrastId}>
                Contrast
              </h3>
              <ButtonGroup variant="connected" aria-labelledby={contrastId}>
                {contrastSchema.options.map((value) => (
                  <Button
                    key={value}
                    variant="tonal"
                    icon={<MdSymbol>{contrastLabels[value].icon}</MdSymbol>}
                    aria-pressed={contrast === value}
                    onClick={() => setContrast(value)}
                  >
                    {contrastLabels[value].label}
                  </Button>
                ))}
              </ButtonGroup>
            </section>
            <section {...preferencesBem({ element: "section" })} aria-labelledby={paletteId}>
              <h3 {...preferencesBem({ element: "label" })} id={paletteId}>
                Palette
              </h3>
              <ButtonGroup variant="connected" aria-labelledby={paletteId}>
                {paletteSchema.options.map((value) => (
                  <Button
                    key={value}
                    variant="tonal"
                    icon={<MdSymbol>{paletteLabels[value].icon}</MdSymbol>}
                    data-palette={value}
                    data-contrast={contrast}
                    aria-pressed={palette === value}
                    onClick={() => setPalette(value)}
                  >
                    {paletteLabels[value].label}
                  </Button>
                ))}
              </ButtonGroup>
            </section>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
