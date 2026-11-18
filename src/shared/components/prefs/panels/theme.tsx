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
  type Contrast,
} from "#/shared/constants/prefs";
import { useHapticFeedback } from "#/shared/lib/haptics";

const preferencesBem = BEMHelper("preferences-dialog");

type PreferenceSectionProps<T extends string> = {
  name: string;
  values: ReadonlyArray<T>;
  labels: Record<T, { label: string; icon: string }>;
  selected: T;
  onChange: (value: T) => void;
  // palette buttons need the contrast as well
  currentContrast?: Contrast;
};

function PreferenceSection<T extends string>({
  name,
  values,
  labels,
  selected,
  onChange,
  currentContrast,
}: PreferenceSectionProps<T>) {
  const { triggerHapticFeedback } = useHapticFeedback();
  const labelId = useId();

  return (
    <section {...preferencesBem({ element: "section" })} aria-labelledby={labelId}>
      <h3 {...preferencesBem({ element: "label" })} id={labelId}>
        {name}
      </h3>
      <SelectMenu
        {...preferencesBem({ element: "select" })}
        label={name}
        name={name.toLowerCase()}
        value={selected}
        onChange={onChange}
        options={values.map((value) => ({
          value,
          label: labels[value].label,
          icon: <MdSymbol>{labels[value].icon}</MdSymbol>,
        }))}
      />
      <ButtonGroup variant="connected" aria-labelledby={labelId}>
        {values.map((value) => (
          <Button
            key={value}
            variant="tonal"
            icon={<MdSymbol>{labels[value].icon}</MdSymbol>}
            data-palette={currentContrast === undefined ? undefined : value}
            data-contrast={currentContrast}
            aria-pressed={selected === value}
            onClick={() => {
              if (selected === value) return;
              onChange(value);
              triggerHapticFeedback("selection");
            }}
          >
            {labels[value].label}
          </Button>
        ))}
      </ButtonGroup>
    </section>
  );
}

export function ThemePanel() {
  const { theme, setTheme } = useTheme();
  const { contrast, setContrast } = useContrast();
  const { palette, setPalette } = usePalette();

  return (
    <TabPanel value="theme">
      <div {...preferencesBem({ element: "theme-settings" })}>
        <PreferenceSection
          name="Theme"
          values={themeSchema.options}
          labels={themeLabels}
          selected={theme}
          onChange={setTheme}
        />
        <PreferenceSection
          name="Contrast"
          values={contrastSchema.options}
          labels={contrastLabels}
          selected={contrast}
          onChange={setContrast}
        />
        <PreferenceSection
          name="Palette"
          values={paletteSchema.options}
          labels={paletteLabels}
          selected={palette}
          onChange={setPalette}
          currentContrast={contrast}
        />
      </div>
    </TabPanel>
  );
}
