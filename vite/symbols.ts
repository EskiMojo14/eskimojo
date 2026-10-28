import { SourceMap } from "node:module";
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

function collectSymbols(node: unknown, symbols: Set<string>): boolean {
  if (!isNode(node)) return false;
  if (typeof node.value === "string") {
    symbols.add(node.value.trim());
    return true;
  }
  if (node.type === "ConditionalExpression") {
    const consequentKnown = collectSymbols(node.consequent, symbols);
    const alternateKnown = collectSymbols(node.alternate, symbols);
    return consequentKnown && alternateKnown;
  }
  return false;
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
      name: "used-symbols:collect",
      enforce: "post",
      apply: "build",
      async buildStart() {
        usedSymbols.clear();
        const registeredSymbols = [...knownSymbols];
        if (knownSymbolsModule) {
          const { module } = await runnerImport<{ default: Array<string> }>(knownSymbolsModule, {
            resolve: { alias: { "#": fileURLToPath(new URL("../src", import.meta.url)) } },
          });
          registeredSymbols.push(...module.default);
        }
        for (const symbol of registeredSymbols) {
          const name = symbol.trim();
          if (!name)
            this.error("Registered Material Symbol names must not be empty or whitespace.");
          usedSymbols.add(name);
        }
      },
      transform(code, id) {
        if (!code?.includes("MdSymbol")) return;
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
          if (!collectSymbols(children, usedSymbols)) {
            const position = isNode(children) ? children.start : node.start;
            const precedingLines =
              typeof position === "number" ? code.slice(0, position).split("\n") : undefined;
            const generatedLine = (precedingLines?.length ?? 1) - 1;
            const generatedColumn = precedingLines?.at(-1)?.length ?? 0;
            const original = new SourceMap({
              sourceRoot: "",
              ...this.getCombinedSourcemap(),
            }).findEntry(generatedLine, generatedColumn);
            const loc =
              "originalLine" in original
                ? {
                    file: original.originalSource.startsWith("file:")
                      ? fileURLToPath(original.originalSource)
                      : original.originalSource,
                    line: original.originalLine + 1,
                    column: original.originalColumn,
                  }
                : { file: id, line: generatedLine + 1, column: generatedColumn };
            this.warn({
              id,
              loc,
              message:
                `${loc.file}:${loc.line}:${loc.column + 1}: ` +
                "Unresolved dynamic MdSymbol children; add all possible names to vite/known-symbols.ts.",
            });
          }
        });
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
