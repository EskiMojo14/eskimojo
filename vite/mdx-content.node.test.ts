import { build, createServer, type Plugin } from "vite-plus";
import { expect, onTestFinished, test } from "vite-plus/test";

import { code } from "#/utils";

import { mdxContentAttributes } from "./mdx-content";

function fixture(source: string): Array<Plugin> {
  const modules = new Map([
    ["/mdx-fixture.tsx", source],
    ["/example.mdx?content", code.js`export default "application preview";`],
    ["/example.mdx", code.js`export default "plain markdown";`],
    ["/docs.doc.mdx", code.js`export default "storybook docs";`],
    ["/data.json", JSON.stringify({ message: "json data" })],
  ]);
  return [
    mdxContentAttributes(),
    {
      name: "mdx-content-fixture",
      resolveId(id) {
        const resolved = id.startsWith("./") ? `/${id.slice(2)}` : id;
        return modules.has(resolved) ? resolved : undefined;
      },
      load: (id) => modules.get(id),
    },
  ];
}

async function compile(source: string): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: fixture(source),
    build: {
      write: false,
      minify: false,
      rolldownOptions: {
        input: "/mdx-fixture.tsx",
        external: ["react/jsx-runtime"],
        preserveEntrySignatures: "strict",
      },
    },
  });
  if (Array.isArray(result) || !("output" in result))
    throw new Error("Expected a single build output.");
  return result.output
    .filter((item) => item.type === "chunk")
    .map((item) => item.code)
    .join("\n");
}

const attributedImport = code.tsx`
  import Content from "./example.mdx" with {
    "type": "mdx",
  };
  const label: string = "preview";
  export const preview = <section aria-label={label}>{Content}</section>;
`;

test("selects application MDX from attributed TSX imports in production", async () => {
  const result = await compile(attributedImport);
  expect(result).toContain("application preview");
  expect(result).not.toContain("plain markdown");
});

test("selects the same application MDX compiler in the dev server", async () => {
  const server = await createServer({
    configFile: false,
    logLevel: "silent",
    plugins: fixture(attributedImport),
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  });
  onTestFinished(() => server.close());
  const result = await server.transformRequest("/mdx-fixture.tsx");
  expect(result?.code).toContain("example.mdx?content");
  expect(result?.code).not.toContain('"type": "mdx"');
});

test("leaves docs, ordinary MDX, JSON attributes, and lookalike strings alone", async () => {
  const result = await compile(code.ts`
    import Docs from "./docs.doc.mdx";
    import Plain from "./example.mdx";
    import Data from "./data.json" with { type: "json" };
    const example = 'import Preview from "./example.mdx" with { type: "mdx" };';
    export const values = [Docs, Plain, Data.message, example];
  `);
  const module: unknown = await import(
    /* @vite-ignore */ `data:text/javascript,${encodeURIComponent(result)}`
  );
  expect(module).toMatchObject({
    values: [
      "storybook docs",
      "plain markdown",
      "json data",
      code.js`import Preview from "./example.mdx" with { type: "mdx" };`,
    ],
  });
});

test.each(["./data.json", "./docs.doc.mdx"])(
  "rejects the application MDX attribute on %s",
  async (path) => {
    await expect(
      compile(code.js`import Content from "${path}" with { type: "mdx" }; export default Content;`),
    ).rejects.toThrow("requires an application .mdx file");
  },
);

test("does not silently discard additional import attributes", async () => {
  await expect(
    compile(code.js`
      import Content from "./example.mdx" with { type: "mdx", other: "value" };
      export default Content;
    `),
  ).rejects.toThrow("only support");
});
