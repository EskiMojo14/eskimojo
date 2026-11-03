import BEMHelper from "react-bem-helper";

import { fullPeriodLabels, periodSchema } from "#/routes/music.{-$breakdown}/-query.ts";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";

const periodPickerBem = BEMHelper("music-period-picker");

export function MusicPeriodPicker() {
  return (
    <ChipGroup {...periodPickerBem()} aria-label="Listening period">
      {periodSchema.options.map((value) => (
        <InternalLinkChip
          key={value}
          from="/music/{-$breakdown}/"
          to="."
          search={(previous) => ({
            ...previous,
            period: value === periodSchema.fallback ? undefined : value,
          })}
          activeOptions={{ exact: true }}
          replace
        >
          {fullPeriodLabels[value]}
        </InternalLinkChip>
      ))}
    </ChipGroup>
  );
}
