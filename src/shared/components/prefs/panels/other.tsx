import { useHydrated } from "@tanstack/react-router";
import { useId } from "react";
import BEMHelper from "react-bem-helper";
import { useWebHaptics } from "web-haptics/react";

import { Button } from "#/shared/components/buttons/button";
import { ButtonGroup } from "#/shared/components/buttons/button-group";
import { ListItemContent } from "#/shared/components/list";
import { useDensity, useHaptics } from "#/shared/components/prefs/context";
import { SelectMenu } from "#/shared/components/select-menu";
import { Switch } from "#/shared/components/switch";
import { MdSymbol } from "#/shared/components/symbol";
import { TabPanel } from "#/shared/components/tabs";
import { densitySchema, densityLabels } from "#/shared/constants/prefs";
import { useHapticFeedback } from "#/shared/lib/haptics";

const preferencesBem = BEMHelper("preferences-dialog");

export function OtherPanel() {
  const { density, setDensity } = useDensity();
  const { haptics, setHaptics } = useHaptics();
  const { trigger, isSupported } = useWebHaptics();
  const { triggerHapticFeedback } = useHapticFeedback();
  const hydrated = useHydrated();
  const hapticsId = useId();
  const hapticsLabelId = useId();
  const densityLabelId = useId();

  return (
    <TabPanel value="other">
      <section {...preferencesBem({ element: "section" })} aria-labelledby={densityLabelId}>
        <h3 {...preferencesBem({ element: "label" })} id={densityLabelId}>
          Density
        </h3>
        <SelectMenu
          {...preferencesBem({ element: "select" })}
          label="Density"
          name="density"
          value={density}
          onChange={setDensity}
          options={densitySchema.options.map((value) => ({
            value,
            label: densityLabels[value].label,
            icon: <MdSymbol>{densityLabels[value].icon}</MdSymbol>,
          }))}
        />
        <ButtonGroup variant="connected" aria-labelledby={densityLabelId}>
          {densitySchema.options.map((value) => (
            <Button
              key={value}
              variant="tonal"
              icon={<MdSymbol>{densityLabels[value].icon}</MdSymbol>}
              aria-pressed={density === value}
              onClick={() => {
                if (density === value) return;
                setDensity(value);
                triggerHapticFeedback("selection");
              }}
            >
              {densityLabels[value].label}
            </Button>
          ))}
        </ButtonGroup>
      </section>
      {hydrated && isSupported && (
        <label {...preferencesBem({ element: "toggle" })} htmlFor={hapticsId}>
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
      )}
      {hydrated && !isSupported && <p>Haptic feedback is not supported by this browser.</p>}
    </TabPanel>
  );
}
