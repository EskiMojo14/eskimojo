import { readFile } from "node:fs/promises";
import path from "node:path";

import query from "esquery";
import type { Node } from "estree";
import { transformWithOxc, type ESTree, type Plugin } from "vite-plus";

import { writeFormatted } from "../scripts/write-formatted";

interface ServerFnMetadata {
  id: string;
  name: string;
  filename: string;
}

interface Options {
  output: URL;
}

const ts = String.raw;
const esquery = String.raw;

// esquery treats line breaks as identifier characters, so keep selectors on one line.
const rpcImportSelector = esquery`Program > ImportDeclaration[source.value="@tanstack/react-start/server-rpc"] > ImportSpecifier`;
const rpcCallSelector = esquery`:matches(Program, Program > ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator > CallExpression.init`;
const exportSelector = esquery`Program > :matches(ExportDefaultDeclaration, ExportNamedDeclaration[source=null])`;

function queryAst(ast: ESTree.Program, selector: string): Array<Node> {
  // Vite's JavaScript AST is ESTree-compatible, but its Oxc types also describe non-ESTree syntax.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return query(ast as Node, selector);
}

function isNode(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "type" in value;
}

function nameOf(node: unknown): string | undefined {
  if (!isNode(node)) return undefined;
  const name = node.type === "Identifier" ? node.name : node.value;
  return typeof name === "string" ? name : undefined;
}

function metadataFrom(node: unknown): ServerFnMetadata {
  if (!isNode(node) || node.type !== "ObjectExpression" || !Array.isArray(node.properties))
    throw new Error("Expected literal createServerRpc metadata.");
  const fields = new Map<string, string>();
  for (const property of node.properties) {
    if (!isNode(property) || property.type !== "Property" || property.computed)
      throw new Error("Unsupported createServerRpc metadata property.");
    const key = nameOf(property.key);
    if (key !== "id" && key !== "name" && key !== "filename") continue;
    const value = property.value;
    if (
      !isNode(value) ||
      value.type !== "Literal" ||
      typeof value.value !== "string" ||
      !value.value
    )
      throw new Error(`Expected a non-empty literal createServerRpc ${key}.`);
    if (fields.has(key)) throw new Error(`Duplicate createServerRpc ${key}.`);
    fields.set(key, value.value);
  }
  const id = fields.get("id");
  const name = fields.get("name");
  const filename = fields.get("filename");
  if (!id || !name || !filename) throw new Error("Incomplete createServerRpc metadata.");
  return { id, name, filename };
}

function exportedNames(ast: ESTree.Program): Map<string, Array<string>> {
  const exports = new Map<string, Array<string>>();
  function add(local: string | undefined, exported: string | undefined) {
    if (local && exported) exports.set(local, [...(exports.get(local) ?? []), exported]);
  }
  for (const statement of queryAst(ast, exportSelector)) {
    if (statement.type === "ExportDefaultDeclaration") {
      add(nameOf(statement.declaration), "default");
    } else if (statement.type === "ExportNamedDeclaration" && !statement.source) {
      const declaration = statement.declaration;
      if (declaration?.type === "VariableDeclaration") {
        for (const item of declaration.declarations) {
          add(nameOf(item.id), nameOf(item.id));
        }
      }
      for (const specifier of statement.specifiers) {
        add(nameOf(specifier.local), nameOf(specifier.exported));
      }
    }
  }
  return exports;
}

/**
 * Version-sensitive integration with TanStack's compiler output, not a public manifest API.
 * Relies on:
 * - TanStack's server provider transform running before this hook, with imports and
 *   calls still intact before bundling/minification.
 * - A named createServerRpc import from @tanstack/react-start/server-rpc and
 *   top-level variable initializers calling that binding with literal { id, name, filename }.
 * - Metadata names matching local bindings in the original source, with filenames
 *   relative to the project root under src/. Export discovery supports variable
 *   declarations, local export aliases, and identifier default exports, not re-exports.
 * - TanStack injecting a JSON-encoded process.env.TSS_SERVER_FN_BASE define, and
 *   Vite's JavaScript parser producing an ESTree-compatible AST for esquery.
 *
 * This avoids reproducing hashes or scraping minified bundles, but compiler changes
 * can still break it without a public API change. Validation catches malformed
 * metadata, collisions, and missing calls in recognized provider modules; it cannot
 * prove completeness if only some functions switch to an unrecognized output shape.
 * After TanStack or Vite upgrades, run the registry fixtures, a production build,
 * and preference/music E2E tests. Regenerate the registry for the app build under test.
 */
export default function serverFnRegistry({ output }: Options): Plugin {
  const functions = new Map<string, ServerFnMetadata>();
  let root: string;
  let base: string;
  let generated: string;
  return {
    name: "e2e-server-fn-registry",
    enforce: "post",
    apply: "build",
    applyToEnvironment: (environment) => environment.config.consumer === "server",
    configResolved(config) {
      root = config.root;
      const definedBase: unknown = config.define?.["process.env.TSS_SERVER_FN_BASE"];
      if (typeof definedBase !== "string")
        throw new Error(
          "Missing TanStack server-function base. Run the registry plugin after TanStack Start.",
        );
      const parsedBase: unknown = JSON.parse(definedBase);
      if (
        typeof parsedBase !== "string" ||
        !parsedBase.startsWith("/") ||
        !parsedBase.endsWith("/")
      )
        throw new Error("Expected an absolute, slash-terminated TanStack server-function base.");
      base = parsedBase;
    },
    buildStart() {
      functions.clear();
      generated = "";
    },
    transform(code, moduleId) {
      if (!code.includes("server-rpc")) return;
      const ast = this.parse(code);
      const rpcImports = new Set<string>();
      for (const specifier of queryAst(ast, rpcImportSelector)) {
        if (
          specifier.type === "ImportSpecifier" &&
          nameOf(specifier.imported) === "createServerRpc"
        )
          rpcImports.add(specifier.local.name);
      }
      if (!rpcImports.size) return;
      let found = false;
      for (const call of queryAst(ast, rpcCallSelector)) {
        if (
          call.type !== "CallExpression" ||
          call.callee.type !== "Identifier" ||
          !rpcImports.has(call.callee.name)
        )
          continue;
        const metadata = metadataFrom(call.arguments[0]);
        found = true;
        const previous = functions.get(metadata.id);
        if (
          previous &&
          (previous.filename !== metadata.filename || previous.name !== metadata.name)
        )
          this.error(`Conflicting server-function ID ${metadata.id} in ${moduleId}.`);
        for (const fn of functions.values()) {
          if (
            fn.filename === metadata.filename &&
            fn.name === metadata.name &&
            fn.id !== metadata.id
          )
            this.error(`Conflicting IDs for ${metadata.filename}:${metadata.name}.`);
        }
        functions.set(metadata.id, metadata);
      }
      if (!found)
        this.error(
          `No literal createServerRpc calls found in ${moduleId}; TanStack's compiler output may have changed.`,
        );
    },
    async generateBundle() {
      if (!functions.size)
        this.error("No server functions collected; TanStack's compiler output may have changed.");
      const modules = new Map<string, Map<string, string>>();
      const namesByFile = new Map<string, Map<string, Array<string>>>();
      for (const fn of functions.values()) {
        const filename = fn.filename.replaceAll("\\", "/");
        if (!filename.startsWith("src/") || filename.split("/").includes(".."))
          this.error(`Unsupported server-function source path: ${fn.filename}`);
        let names = namesByFile.get(filename);
        if (!names) {
          const source = await readFile(path.join(root, filename), "utf8");
          const transformed = await transformWithOxc(source, filename);
          names = exportedNames(this.parse(transformed.code));
          namesByFile.set(filename, names);
        }
        for (const exported of names.get(fn.name) ?? []) {
          const entries = modules.get(filename) ?? new Map<string, string>();
          const previous = entries.get(exported);
          if (previous && previous !== fn.id)
            this.error(`Conflicting exported server function ${filename}:${exported}.`);
          entries.set(exported, fn.id);
          modules.set(filename, entries);
        }
      }
      const entries = [...modules]
        .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([filename, exports]) => {
          const specifier = `#/${filename.slice("src/".length)}`;
          const refs = [...exports]
            .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(
              ([name, id]) =>
                ts`${JSON.stringify(name)}: serverFnRef<typeof import(${JSON.stringify(specifier)})[${JSON.stringify(name)}]>(${JSON.stringify(`*${base}${id}`)}),`,
            )
            .join("");
          return ts`${JSON.stringify(filename)}: {${refs}},`;
        })
        .join("\n");
      generated = ts`
        // Generated by vite/server-fn-registry.ts. Regenerate with vp run build.
        import { serverFnRef } from "#test/e2e/msw";
        export const serverFns = {${entries}};
      `;
      this.emitFile({ type: "asset", fileName: "server-fns.gen.ts", source: generated });
    },
    async writeBundle() {
      await writeFormatted(output, generated);
    },
  };
}
