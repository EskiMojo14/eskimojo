import { getRouteApi } from "@tanstack/react-router";
import BEMHelper from "react-bem-helper";

import { fullPeriodLabels, periodSchema } from "#/routes/music.{-$breakdown}/-query.ts";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";

const musicRoute = getRouteApi("/music/{-$breakdown}/");
const periodPickerBem = BEMHelper("music-period-picker");

export function MusicPeriodPicker() {
  const { period = periodSchema.fallback } = musicRoute.useSearch();
  return (
    <ChipGroup {...periodPickerBem()} aria-label="Listening period">
      {periodSchema.options.map((value) => (
        <InternalLinkChip
          key={value}
          from="/music/{-$breakdown}/"
          to="."
          search={(previous) => ({ ...previous, period: value })}
          aria-current={period === value ? "page" : undefined}
          replace
        >
          {fullPeriodLabels[value]}
        </InternalLinkChip>
      ))}
    </ChipGroup>
  );
}
