import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";

export function ErrorPage() {
  return (
    <main className="page-state">
      <EmptyState
        icon={<MdSymbol>error</MdSymbol>}
        title="Something went wrong"
        description="Please try again later."
      />
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="page-state">
      <EmptyState
        icon={<MdSymbol>search_off</MdSymbol>}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
      />
    </main>
  );
}
