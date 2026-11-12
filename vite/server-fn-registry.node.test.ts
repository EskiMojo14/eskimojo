import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { build, transformWithOxc } from "vite-plus";
import { expect, onTestFinished, test } from "vite-plus/test";

import serverFnRegistry from "./server-fn-registry";

const js = String.raw;
const ts = String.raw;

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "server-fn-registry-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "src"));
  await writeFile(
    path.join(root, "src/functions.ts"),
    ts`
      export const getPost = () => Promise.resolve({ title: "Post" });
      const save = () => Promise.resolve();
      export { save as savePost };
      export default getPost;
      export { save as "save-post" };
      const privateFn = () => Promise.resolve();
    `,
  );
  const output = pathToFileURL(path.join(root, "server-fns.gen.ts"));
  async function compile(source: string, { write = false, fail = false } = {}) {
    const result = await build({
      configFile: false,
      root,
      logLevel: "silent",
      define: { "process.env.TSS_SERVER_FN_BASE": JSON.stringify("/custom/functions/") },
      plugins: [
        {
          name: "server-fn-fixture",
          resolveId(id) {
            return id === "/provider.js" ? id : null;
          },
          load(id) {
            return id === "/provider.js" ? source : null;
          },
        },
        serverFnRegistry({ output }),
        {
          name: "failed-build-fixture",
          generateBundle() {
            if (fail) this.error("Build interrupted");
          },
        },
      ],
      build: {
        ssr: true,
        write,
        rolldownOptions: {
          input: "/provider.js",
          external: ["@tanstack/react-start/server-rpc", "unrelated/server-rpc"],
          output: { format: "es" },
          preserveEntrySignatures: "strict",
        },
      },
    });
    if (Array.isArray(result) || !("output" in result))
      throw new Error("Expected a single build output.");
    const registry = result.output.find((item) => item.fileName === "server-fns.gen.ts");
    if (registry?.type !== "asset" || typeof registry.source !== "string")
      throw new Error("Expected a generated registry asset.");
    return registry.source;
  }
  return { compile, output };
}

const provider = js`
  import { createServerRpc as rpc } from "@tanstack/react-start/server-rpc";
  export const get = rpc({ filename: "src/functions.ts", name: "getPost", id: "get-id", futureField: true }, () => {});
  export const save = rpc({ name: "save", id: "save-id", filename: "src/functions.ts" }, () => {});
  export const hidden = rpc({ id: "private-id", name: "privateFn", filename: "src/functions.ts" }, () => {});
`;

test("generates typed descriptors from imported RPC metadata, including export aliases", async () => {
  const { compile } = await fixture();
  const registry = await compile(provider);
  expect(registry).toContain('"src/functions.ts"');
  expect(registry).toContain(
    '"savePost": serverFnRef<typeof import("#/functions.ts")["savePost"]>',
  );
  expect(registry).toContain('"default": serverFnRef<typeof import("#/functions.ts")["default"]>');
  expect(registry).toContain(
    '"save-post": serverFnRef<typeof import("#/functions.ts")["save-post"]>',
  );
  expect(registry).toContain("*/custom/functions/get-id");
  expect(registry).toContain("*/custom/functions/save-id");
  expect(registry).not.toContain("private-id");
  const runtime = await transformWithOxc(registry, "server-fns.gen.ts");
  expect(runtime.code).not.toContain("#/functions.ts");
  expect(runtime.code).toContain("#test/e2e/msw");
});

test("ignores lookalike RPC calls from unrelated imports", async () => {
  const { compile } = await fixture();
  const registry = await compile(js`
    ${provider}
    import { createServerRpc } from "unrelated/server-rpc";
    export const unrelated = createServerRpc({ id: "unrelated" }, () => {});
  `);
  expect(registry).not.toContain("unrelated");
});

test("ignores nested RPC calls whose bindings shadow the imported alias", async () => {
  const { compile } = await fixture();
  const registry = await compile(js`
    ${provider}
    export function nested(rpc) {
      const get = rpc({ id: "nested-id", name: "getPost", filename: "src/functions.ts" }, () => {});
      return get;
    }
  `);
  expect(registry).toContain("*/custom/functions/get-id");
  expect(registry).not.toContain("nested-id");
});

test.each([
  [js`{ name: "getPost", filename: "src/functions.ts" }`, "Incomplete createServerRpc metadata"],
  [
    js`{ id: globalThis.id, name: "getPost", filename: "src/functions.ts" }`,
    "literal createServerRpc id",
  ],
  [js`{ ...globalThis.meta }`, "Unsupported createServerRpc metadata property"],
])(
  "rejects unsupported metadata instead of generating partial mocks: %s",
  async (metadata, error) => {
    const { compile } = await fixture();
    await expect(
      compile(js`
      import { createServerRpc } from "@tanstack/react-start/server-rpc";
      export const fn = createServerRpc(${metadata}, () => {});
    `),
    ).rejects.toThrow(error);
  },
);

test.each([
  [
    js`{ id: "get-id", name: "save", filename: "src/functions.ts" }`,
    "Conflicting server-function ID",
  ],
  [js`{ id: "another-id", name: "getPost", filename: "src/functions.ts" }`, "Conflicting IDs"],
])("rejects conflicting function identities: %s", async (metadata, error) => {
  const { compile } = await fixture();
  await expect(
    compile(js`
      ${provider}
      export const conflicting = rpc(${metadata}, () => {});
    `),
  ).rejects.toThrow(error);
});

test("fails explicitly when the compiler no longer exposes supported RPC metadata", async () => {
  const { compile } = await fixture();
  await expect(compile(js`export const fn = () => {};`)).rejects.toThrow(
    "No server functions collected",
  );
});

test("writes the source registry only after a successful build", async () => {
  const { compile, output } = await fixture();
  await expect(compile(provider, { write: true, fail: true })).rejects.toThrow("Build interrupted");
  await expect(readFile(output, "utf8")).rejects.toThrow("ENOENT");
  await compile(provider, { write: true });
  const first = await readFile(output, "utf8");
  await compile(provider, { write: true });
  expect(await readFile(output, "utf8")).toBe(first);
  await expect(
    compile(provider.replace("get-id", "changed-id"), { write: true, fail: true }),
  ).rejects.toThrow("Build interrupted");
  expect(await readFile(output, "utf8")).toBe(first);
});
