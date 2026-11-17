import { useHydrated } from "@tanstack/react-router";
import { useId } from "react";
import BEMHelper from "react-bem-helper";
import { useWebHaptics } from "web-haptics/react";

import { ListItemContent } from "#/shared/components/list";
import { useHaptics } from "#/shared/components/prefs/context";
import { Switch } from "#/shared/components/switch";
import { MdSymbol } from "#/shared/components/symbol";
import { TabPanel } from "#/shared/components/tabs";

const preferencesBem = BEMHelper("preferences-dialog");

export function OtherPanel() {
  const { haptics, setHaptics } = useHaptics();
  const { trigger, isSupported } = useWebHaptics();
  const hydrated = useHydrated();
  const hapticsId = useId();
  const hapticsLabelId = useId();

  return (
    <TabPanel value="other">
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
