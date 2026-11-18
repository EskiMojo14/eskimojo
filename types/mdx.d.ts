// Only the Vitest type-test project loads this fallback; the app uses the content mapper.
declare module "*.mdx" {
  import type { MDXContent } from "mdx/types";

  const content: MDXContent;
  export default content;
}
