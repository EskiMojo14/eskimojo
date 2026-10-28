import { fileURLToPath } from "node:url";

import { runnerImport, type Plugin } from "vite-plus";

import { symbolsUrl } from "../src/shared/lib/symbols";

interface Options {
  /** Names used in interpolated children, which cannot be extracted statically. */
  knownSymbols?: Array<string>;
  /**
   * Path to a module whose default export lists more known symbols. It's loaded at
   * build time rather than imported by the config, so editing its dependencies
   * doesn't restart the dev server.
   */
  knownSymbolsModule?: string;
}

function isNode(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "type" in value;
}

function nameOf(node: unknown): unknown {
  if (!isNode(node)) return undefined;
  return node.type === "Identifier" ? node.name : node.value;
}

function visit(node: unknown, onCall: (node: Record<string, unknown>) => void): void {
  if (!isNode(node)) return;
  if (node.type === "CallExpression") onCall(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) visit(child, onCall);
    } else {
      visit(value, onCall);
    }
  }
}

// Adapted from Schema Benchmarks' TanStack Start plugin (see THIRD_PARTY_NOTICES).
export default function materialSymbols({
  knownSymbols = [],
  knownSymbolsModule,
}: Options = {}): Array<Plugin> {
  const usedSymbols = new Set<string>();
  return [
    {
      name: "used-symbols:pre",
      enforce: "pre",
      apply: "build",
      async buildStart() {
        usedSymbols.clear();
        for (const symbol of knownSymbols) usedSymbols.add(symbol);
        if (!knownSymbolsModule) return;
        const { module } = await runnerImport<{ default: Array<string> }>(knownSymbolsModule, {
          resolve: { alias: { "#": fileURLToPath(new URL("../src", import.meta.url)) } },
        });
        for (const symbol of module.default) usedSymbols.add(symbol);
      },
      moduleParsed({ id, code }) {
        if (!code?.includes("MdSymbol")) return;
        let dynamic = 0;
        visit(this.parse(code), (node) => {
          const { callee, arguments: args } = node;
          const name =
            isNode(callee) && callee.type === "MemberExpression"
              ? nameOf(callee.property)
              : nameOf(callee);
          if (
            typeof name !== "string" ||
            !/^(?:_?jsx(?:s|DEV)?\d*|createElement)$/.test(name) ||
            !Array.isArray(args) ||
            nameOf(args[0]) !== "MdSymbol"
          )
            return;

          const props = args[1];
          const children =
            name === "createElement"
              ? args[2]
              : isNode(props) && Array.isArray(props.properties)
                ? props.properties.find(
                    (property: unknown) => isNode(property) && nameOf(property.key) === "children",
                  )?.value
                : undefined;
          if (isNode(children) && typeof children.value === "string") {
            usedSymbols.add(children.value.trim());
          } else {
            dynamic++;
          }
        });
        if (dynamic) {
          this.warn(
            `Found ${dynamic} dynamic MdSymbol children in ${id}; add all possible names to vite/known-symbols.ts.`,
          );
        }
      },
    },
    {
      name: "used-symbols:post",
      enforce: "post",
      apply: "build",
      generateBundle(_options, bundle) {
        if (!usedSymbols.size) return;
        // Google Fonts requires alphabetically sorted names.
        // oxlint-disable-next-line unicorn/no-array-sort
        const names = [...usedSymbols].sort().join(",");
        const finalUrl = `${symbolsUrl}&icon_names=${names}`;
        for (const output of Object.values(bundle)) {
          if (output.type === "chunk") {
            output.code = output.code.replaceAll(symbolsUrl, finalUrl);
          } else if (typeof output.source === "string" && output.fileName.endsWith(".html")) {
            output.source = output.source.replaceAll(symbolsUrl, finalUrl);
          }
        }
      },
    },
  ];
}
