import { getRouteApi } from "@tanstack/react-router";

import { fullPeriodLabels, periodSchema } from "#/routes/music/-query";
import { ChipGroup, InternalLinkChip } from "#/shared/components/chips";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

export function MusicPeriodPicker() {
  const { period = "7day" } = musicRoute.useSearch();
  return (
    <ChipGroup className="music-period-picker" aria-label="Listening period">
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
