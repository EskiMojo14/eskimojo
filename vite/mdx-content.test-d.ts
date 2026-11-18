import { expectTypeOf } from "vite-plus/test";

import SyntaxPreview from "#/shared/components/prefs/syntax-preview.mdx" with { type: "mdx" };

expectTypeOf(SyntaxPreview).not.toBeAny();
expectTypeOf(SyntaxPreview).toBeCallableWith({});
