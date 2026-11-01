import { InternalLinkChip } from "#/shared/components/chips";
import { MdSymbol } from "#/shared/components/symbol/index.tsx";

export interface FilterChipsProps {
  artist?: string;
  venue?: string;
  city?: string;
}

export function FilterChips({ artist, venue, city }: FilterChipsProps) {
  return (
    <div className="filter-chips">
      {artist && (
        <InternalLinkChip
          to="/gigs/{-$breakdown}"
          search={(search) => ({ ...search, artist: undefined })}
          icon={<MdSymbol>artist</MdSymbol>}
        >
          {artist}
        </InternalLinkChip>
      )}
      {venue && (
        <InternalLinkChip
          to="/gigs/{-$breakdown}"
          search={(search) => ({ ...search, venue: undefined })}
          icon={<MdSymbol>stadium</MdSymbol>}
        >
          {venue}
        </InternalLinkChip>
      )}
      {city && (
        <InternalLinkChip
          to="/gigs/{-$breakdown}"
          search={(search) => ({ ...search, city: undefined })}
          icon={<MdSymbol>location_city</MdSymbol>}
        >
          {city}
        </InternalLinkChip>
      )}
    </div>
  );
}
