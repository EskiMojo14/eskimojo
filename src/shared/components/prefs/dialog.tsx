import { useHydrated } from "@tanstack/react-router";
import { useId } from "react";
import BEMHelper from "react-bem-helper";
import { useWebHaptics } from "web-haptics/react";

import { Button } from "#/shared/components/buttons/button";
import { ButtonGroup } from "#/shared/components/buttons/button-group";
import { Dialog, DialogContent, type DialogProps } from "#/shared/components/dialog";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { SelectMenu } from "#/shared/components/select-menu";
import { Switch } from "#/shared/components/switch";
import { MdSymbol } from "#/shared/components/symbol";
import {
  themeSchema,
  themeLabels,
  contrastSchema,
  contrastLabels,
  paletteSchema,
  paletteLabels,
  syntaxSchema,
  syntaxLabels,
} from "#/shared/constants/prefs";
import { useHapticFeedback } from "#/shared/lib/haptics";

import { useTheme, useContrast, usePalette, useHaptics, useSyntax, useMatchLight } from "./context";
import SyntaxPreview from "./syntax-preview.mdx";

const preferencesBem = BEMHelper("preferences-dialog");

export type PreferencesDialogProps = Pick<DialogProps, "open" | "onClose">;

export function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const { theme, setTheme } = useTheme();
  const { contrast, setContrast } = useContrast();
  const { palette, setPalette } = usePalette();
  const { haptics, setHaptics } = useHaptics();
  const { syntax, setSyntax } = useSyntax();
  const { matchLight, setMatchLight } = useMatchLight();
  const { triggerHapticFeedback, isSupported } = useHapticFeedback();
  const { trigger } = useWebHaptics();
  const hydrated = useHydrated();
  const themeId = useId();
  const contrastId = useId();
  const paletteId = useId();
  const hapticsId = useId();
  const hapticsLabelId = useId();
  const matchLightId = useId();
  const matchLightLabelId = useId();

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
          <div {...preferencesBem()}>
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
            <List {...preferencesBem({ element: "syntax-settings" })}>
              <ListItem>
                <SelectMenu
                  {...preferencesBem({ element: "select", modifier: "always" })}
                  label="Syntax"
                  name="syntax"
                  value={syntax}
                  onChange={setSyntax}
                  options={syntaxSchema.options.map((value) => ({
                    value,
                    label: syntaxLabels[value],
                    icon: <MdSymbol>code</MdSymbol>,
                  }))}
                />
              </ListItem>
              <ListItem>
                <label htmlFor={matchLightId}>
                  <ListItemContent
                    headline={<span id={matchLightLabelId}>Match light theme</span>}
                    supportingText="Use Alucard theme for light mode"
                    leading={<MdSymbol>light_mode</MdSymbol>}
                    trailing={
                      <Switch
                        id={matchLightId}
                        aria-labelledby={matchLightLabelId}
                        name="matchLight"
                        checked={matchLight === "on"}
                        onChange={(event) =>
                          setMatchLight(event.currentTarget.checked ? "on" : "off")
                        }
                        onIcon={<MdSymbol>check</MdSymbol>}
                        offIcon={<MdSymbol>close</MdSymbol>}
                      />
                    }
                  />
                </label>
              </ListItem>
              <ListItem {...preferencesBem({ element: "syntax-preview" })}>
                <SyntaxPreview />
              </ListItem>
            </List>
            {hydrated && isSupported && (
              <List {...preferencesBem({ element: "haptics" })}>
                <ListItem>
                  <label htmlFor={hapticsId}>
                    <ListItemContent
                      headline={<span id={hapticsLabelId}>Haptic feedback</span>}
                      leading={<MdSymbol>mobile_vibrate</MdSymbol>}
                      trailing={
                        <Switch
                          id={hapticsId}
                          aria-labelledby={hapticsLabelId}
                          name="haptics"
                          hapticFeedback={false}
                          checked={haptics === "on"}
                          onChange={(event) => {
                            const enabled = event.currentTarget.checked;
                            setHaptics(enabled ? "on" : "off");
                            if (enabled && isSupported) void trigger("selection");
                          }}
                          onIcon={<MdSymbol>check</MdSymbol>}
                          offIcon={<MdSymbol>close</MdSymbol>}
                        />
                      }
                    />
                  </label>
                </ListItem>
              </List>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
