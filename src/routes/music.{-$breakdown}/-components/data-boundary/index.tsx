import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense, useCallback, type ReactNode } from "react";
import BEMHelper from "react-bem-helper";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { Button } from "#/shared/components/buttons/button";
import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";

const errorBem = BEMHelper("music-data-error");
const refreshBem = BEMHelper("music-refresh-notice");

export function MusicDataError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div {...errorBem()}>
      <EmptyState
        role="alert"
        icon={<MdSymbol>cloud_off</MdSymbol>}
        title={title}
        description="Last.fm data is unavailable right now. Please try again."
      />
      <Button variant="tonal" onClick={onRetry} icon={<MdSymbol>refresh</MdSymbol>}>
        Retry
      </Button>
    </div>
  );
}

export function MusicDataBoundary({
  children,
  loading,
  errorTitle,
  resetKey,
}: {
  children: ReactNode;
  loading: ReactNode;
  errorTitle: string;
  resetKey?: string;
}) {
  const renderError = useCallback(
    ({ resetErrorBoundary }: FallbackProps) => (
      <MusicDataError title={errorTitle} onRetry={resetErrorBoundary} />
    ),
    [errorTitle],
  );
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={[resetKey]}
          onError={(error, info) => console.error(errorTitle, error, info.componentStack)}
          fallbackRender={renderError}
        >
          <Suspense key={resetKey} fallback={loading}>
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export function MusicRefreshNotice({
  onRetry,
  isFetching,
}: {
  onRetry: () => void;
  isFetching: boolean;
}) {
  return (
    <div {...refreshBem()}>
      <output>Couldn't refresh recent tracks. Showing the last loaded results.</output>
      <Button variant="text" onClick={onRetry} loading={isFetching}>
        Retry
      </Button>
    </div>
  );
}
