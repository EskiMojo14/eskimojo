import { useId, type ComponentProps, type ComponentPropsWithRef, type ReactNode } from "react";
import BEMHelper from "react-bem-helper";

import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { Skeleton } from "#/shared/components/skeleton";

const recentTracksBem = BEMHelper("recent-tracks");
const topListBem = BEMHelper("music-top-list");
const skeletonBem = BEMHelper("music-skeleton");
const searchLinksBem = BEMHelper("music-search-links");

export function MusicListSkeleton({
  title,
  kind,
}: {
  title: string;
  kind: "recent" | "tracks" | "artists";
}) {
  const ranked = kind !== "recent";
  return (
    <MusicListLayout
      title={title}
      {...skeletonBem({ extra: ranked ? topListBem().className : "" })}
      aria-hidden="true"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <MusicListRow
          key={index}
          style={{ "--skeleton-delay": `${index * 80}ms` }}
          rank={
            ranked ? (
              <Skeleton {...skeletonBem({ element: "line", modifier: "rank" })} />
            ) : undefined
          }
          artwork={<Skeleton {...recentTracksBem({ element: "placeholder" })} />}
          headline={<Skeleton />}
          supportingText={
            kind !== "artists" ? (
              <Skeleton {...skeletonBem({ element: "line", modifier: "short" })} />
            ) : undefined
          }
          actions={
            <span {...searchLinksBem()}>
              {[0, 1].map((link) => (
                <span key={link} {...skeletonBem({ element: "action" })}>
                  <Skeleton {...skeletonBem({ element: "line", modifier: "link" })} />
                </span>
              ))}
            </span>
          }
          trailing={<Skeleton {...skeletonBem({ element: "line", modifier: "short" })} />}
        />
      ))}
    </MusicListLayout>
  );
}

export function MusicListLayout({
  title,
  children,
  emptyState,
  className,
  ...props
}: Omit<ComponentPropsWithRef<"section">, "title"> & {
  title: string;
  emptyState?: ReactNode;
}) {
  const headingId = useId();
  return (
    <section {...props} {...recentTracksBem({ extra: className })} aria-labelledby={headingId}>
      <h2 id={headingId} {...recentTracksBem({ element: "heading" })}>
        {title}
      </h2>
      {emptyState ?? <List aria-labelledby={headingId}>{children}</List>}
    </section>
  );
}

export function MusicListRow({
  rank,
  rankLabel,
  artwork,
  headline,
  supportingText,
  actions,
  trailing,
  ...props
}: Omit<ComponentProps<typeof ListItem>, "children"> & {
  rank?: ReactNode;
  rankLabel?: string;
  artwork: ReactNode;
  headline: ReactNode;
  supportingText?: ReactNode;
  actions: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <ListItem {...props}>
      <ListItemContent
        leading={
          rank != null ? (
            <span {...topListBem({ element: "leading" })}>
              <span {...topListBem({ element: "rank" })} aria-label={rankLabel}>
                {rank}
              </span>
              {artwork}
            </span>
          ) : (
            artwork
          )
        }
        headline={headline}
        supportingText={
          <>
            {supportingText != null && <span>{supportingText}</span>}
            {actions}
          </>
        }
        trailing={trailing}
      />
    </ListItem>
  );
}
