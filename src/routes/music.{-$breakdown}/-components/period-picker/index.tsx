import BEMHelper from "react-bem-helper";

import { periodSchema } from "#/routes/music.{-$breakdown}/-constants";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";

const periodPickerBem = BEMHelper("music-period-picker");

export function MusicPeriodPicker() {
  return (
    <ChipGroup {...periodPickerBem()} aria-label={copy.periods.title}>
      {periodSchema.options.map((value) => (
        <InternalLinkChip
          key={value}
          from="/music/{-$breakdown}/{-$type}"
          to="."
          search={(previous) => ({
            ...previous,
            period: value === periodSchema.fallback ? undefined : value,
          })}
          activeOptions={{ exact: true }}
          replace
        >
          {copy.periods.labels[value]}
        </InternalLinkChip>
      ))}
    </ChipGroup>
  );
}
