import { lazyRouteComponent } from "@tanstack/react-router";
import type { MDXModule } from "mdx/types";

const modules = import.meta.glob<MDXModule>("./-content/*.mdx");
const components = new Map(
  Object.entries(modules).map(([path, load]) => [path, lazyRouteComponent(load)]),
);

export function getProjectContent(filePath: string) {
  const component = components.get(`./-content/${filePath}`);
  if (!component) throw new Error(`No project description found for "${filePath}".`);
  return component;
}
