# Mocking server functions

## Browser tests

Import `mockServerFn` from `#test/browser/msw` and pass the server function
itself. Vite compiles browser tests, so the function has its generated URL:

```ts
network.use(mockServerFn(getPost, ({ id }) => ({ id, title: "Mocked post" })));
```

## Playwright E2E tests

Import `mockServerFn` from `#test/e2e/msw` and use the generated registry.
Playwright does not run imports through TanStack's Vite compiler, so importing
an application server function directly does not provide its compiled URL.

```ts
import { passthrough } from "msw";

import { disposablePromise } from "#/utils";
import { mockServerFn } from "#test/e2e/msw";
import { serverFns } from "#test/e2e/server-fns.gen";

const prefs = serverFns["src/shared/lib/prefs.ts"];

using pending = disposablePromise();
network.use(
  mockServerFn(prefs.setThemeFn, async () => {
    await pending.promise;
    return passthrough();
  }),
  mockServerFn(prefs.getThemeFn, () => "dark"),
);
```

The callback receives the function's input data directly. Its input and return
types come from the original function, without importing that function at
runtime. Return the function's result to mock success, throw an error to mock
failure, or return an MSW `Response` (including `passthrough()`) for direct
control. A delayed passthrough still executes the real cookie save.
Const type inference preserves literal-union results, but can infer inline
empty arrays as readonly. For a mutable array result, use a variable typed as
an array of the expected elements or annotate the callback's return type.

The helper handles JSON GET/POST payloads and TanStack's Seroval result/error
envelopes. It deliberately rejects unsupported encodings such as FormData;
use a custom MSW handler for those. Custom TanStack serialization plugins and
streaming results are not supported. These handlers intercept browser requests
only, not SSR calls or server-to-server requests.

## Registry generation

Run `vp run build` before E2E tests, including after adding, moving, or renaming
server functions. The server build regenerates
[`test/e2e/server-fns.gen.ts`](../test/e2e/server-fns.gen.ts) and emits a copy
alongside the server bundle. Keep the source registry checked in so formatting
and type checks work before the build on a clean checkout. Do not edit it by hand.
When using `E2E_BASE_URL`, use the registry from the same application build.

[`vite/server-fn-registry.ts`](../vite/server-fn-registry.ts) reads the metadata
TanStack emits into its provider modules, before bundling or minification. It
matches the imported `createServerRpc` binding, not arbitrary calls or hashes,
and reads the configured server-function base rather than assuming
`/_serverFn/`. Named esquery selectors locate imports, top-level RPC call
initializers, and source exports; binding checks and metadata validation remain
explicit. It parses the source exports to preserve aliases and exclude
private functions. Registry entries are grouped by their defining source module
under `src/`; re-exporting a function elsewhere does not create another group.

This is a compiler-output integration, not a public TanStack manifest API.
Malformed metadata, conflicting identities, or no discovered functions fail
the build explicitly. Fixture tests cover the supported output shape, while
the preference and music E2E tests exercise the real production compiler and
wire format. After upgrading TanStack Start, run those checks and a production
build rather than assuming its internal metadata format is unchanged.
