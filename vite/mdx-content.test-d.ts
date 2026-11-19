import { expectTypeOf } from "vite-plus/test";

import CodePreview from "#/shared/components/prefs/code-preview.mdx" with { type: "mdx" };

expectTypeOf(CodePreview).not.toBeAny();

expectTypeOf(CodePreview).toBeCallableWith({});
