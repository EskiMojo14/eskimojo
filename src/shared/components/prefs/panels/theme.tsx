import { useId } from "react";
import BEMHelper from "react-bem-helper";

import { Button } from "#/shared/components/buttons/button";
import { ButtonGroup } from "#/shared/components/buttons/button-group";
import { useTheme, useContrast, usePalette } from "#/shared/components/prefs/context";
import { SelectMenu } from "#/shared/components/select-menu";
import { MdSymbol } from "#/shared/components/symbol";
import { TabPanel } from "#/shared/components/tabs";
import {
  themeSchema,
  themeLabels,
  contrastSchema,
  contrastLabels,
  paletteSchema,
  paletteLabels,
} from "#/shared/constants/prefs";
import { useHapticFeedback } from "#/shared/lib/haptics";

const preferencesBem = BEMHelper("preferences-dialog");

export function ThemePanel() {
  const { theme, setTheme } = useTheme();
  const { contrast, setContrast } = useContrast();
  const { palette, setPalette } = usePalette();
  const { triggerHapticFeedback } = useHapticFeedback();
  const themeId = useId();
  const contrastId = useId();
  const paletteId = useId();

  return (
    <TabPanel value="theme">
      <div {...preferencesBem({ element: "theme-settings" })}>
        <section {...preferencesBem({ element: "section" })} aria-labelledby={themeId}>
          <h3 {...preferencesBem({ element: "label" })} id={themeId}>
            Theme
          </h3>
          <SelectMenu
            {...preferencesBem({ element: "select" })}
            label="Theme"
            name="theme"
            value={theme}
            onChange={setTheme}
            options={themeSchema.options.map((value) => ({
              value,
              label: themeLabels[value].label,
              icon: <MdSymbol>{themeLabels[value].icon}</MdSymbol>,
            }))}
          />
          <ButtonGroup variant="connected" aria-labelledby={themeId}>
            {themeSchema.options.map((value) => (
              <Button
                key={value}
                variant="tonal"
                icon={<MdSymbol>{themeLabels[value].icon}</MdSymbol>}
                aria-pressed={theme === value}
                onClick={() => {
                  if (theme === value) return;
                  setTheme(value);
                  triggerHapticFeedback("selection");
                }}
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
          <SelectMenu
            {...preferencesBem({ element: "select" })}
            label="Contrast"
            name="contrast"
            value={contrast}
            onChange={setContrast}
            options={contrastSchema.options.map((value) => ({
              value,
              label: contrastLabels[value].label,
              icon: <MdSymbol>{contrastLabels[value].icon}</MdSymbol>,
            }))}
          />
          <ButtonGroup variant="connected" aria-labelledby={contrastId}>
            {contrastSchema.options.map((value) => (
              <Button
                key={value}
                variant="tonal"
                icon={<MdSymbol>{contrastLabels[value].icon}</MdSymbol>}
                aria-pressed={contrast === value}
                onClick={() => {
                  if (contrast === value) return;
                  setContrast(value);
                  triggerHapticFeedback("selection");
                }}
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
          <SelectMenu
            {...preferencesBem({ element: "select" })}
            label="Palette"
            name="palette"
            value={palette}
            onChange={setPalette}
            options={paletteSchema.options.map((value) => ({
              value,
              label: paletteLabels[value].label,
              icon: <MdSymbol>{paletteLabels[value].icon}</MdSymbol>,
            }))}
          />
          <ButtonGroup variant="connected" aria-labelledby={paletteId}>
            {paletteSchema.options.map((value) => (
              <Button
                key={value}
                variant="tonal"
                icon={<MdSymbol>{paletteLabels[value].icon}</MdSymbol>}
                data-palette={value}
                data-contrast={contrast}
                aria-pressed={palette === value}
                onClick={() => {
                  if (palette === value) return;
                  setPalette(value);
                  triggerHapticFeedback("selection");
                }}
              >
                {paletteLabels[value].label}
              </Button>
            ))}
          </ButtonGroup>
        </section>
      </div>
    </TabPanel>
  );
}
