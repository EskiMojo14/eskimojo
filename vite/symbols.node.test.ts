import { build } from "vite-plus";
import { expect, test } from "vite-plus/test";

import { symbolsUrl } from "../src/shared/lib/symbols";
import materialSymbols from "./symbols";

async function compile(source: string, knownSymbols: Array<string> = []) {
  const warnings: Array<string> = [];
  const warningLocations: Array<{ file?: string; line: number; column: number }> = [];
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "symbol-fixture",
        resolveId(id) {
          return id === "/symbol-fixture.tsx" ? id : null;
        },
        load(id) {
          return id === "/symbol-fixture.tsx" ? source : null;
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "iframe.html",
            source: `<link rel="stylesheet" href="${symbolsUrl}">`,
          });
        },
      },
      materialSymbols({ knownSymbols }),
    ],
    build: {
      write: false,
      minify: true,
      rolldownOptions: {
        input: "/symbol-fixture.tsx",
        external: ["react/jsx-runtime", "react/jsx-dev-runtime"],
        onLog(level, log, defaultHandler) {
          if (level === "warn") {
            warnings.push(log.message);
            if (log.loc) warningLocations.push(log.loc);
          } else defaultHandler(level, log);
        },
        output: { format: "es" },
        preserveEntrySignatures: "strict",
      },
    },
  });
  if (Array.isArray(result) || !("output" in result))
    throw new Error("Expected a single build output");
  const code = result.output
    .filter((item) => item.type === "chunk")
    .map((item) => item.code)
    .join("\n");
  const html = result.output.find(
    (item) => item.type === "asset" && item.fileName === "iframe.html",
  );
  return { code, html, warnings, warningLocations };
}

const prefix = `
  function MdSymbol(props) { return props.children; }
  export const font = ${JSON.stringify(symbolsUrl)};
`;

test("extracts real JSX children, deduplicates and sorts the production request", async () => {
  const { code, html, warnings } = await compile(`${prefix}
    export const icons = [<MdSymbol>search</MdSymbol>, <MdSymbol>favorite</MdSymbol>, <MdSymbol>{"search"}</MdSymbol>];
  `);
  expect(code).toContain(`${symbolsUrl}&icon_names=favorite,search`);
  expect(html).toMatchObject({
    source: `<link rel="stylesheet" href="${symbolsUrl}&icon_names=favorite,search">`,
  });
  expect(warnings).toEqual([]);
});

test("warns about expressions and includes explicitly registered dynamic symbols", async () => {
  const { code, warnings } = await compile(
    `${prefix}
    export const icon = <MdSymbol>{globalThis.icon}</MdSymbol>;
  `,
    ["warning", "close", "warning"],
  );
  expect(code).toContain(`${symbolsUrl}&icon_names=close,warning`);
  expect(warnings).toEqual([expect.stringContaining("dynamic MdSymbol children")]);
});

test("extracts both branches of nested ternaries without manual registration", async () => {
  const { code, warnings } = await compile(`${prefix}
    export const icon = <MdSymbol>{globalThis.paused ? "play_arrow" : globalThis.stopped ? "stop" : "pause"}</MdSymbol>;
  `);
  expect(code).toContain(`${symbolsUrl}&icon_names=pause,play_arrow,stop`);
  expect(warnings).toEqual([]);
});

test("extracts literal ternary branches while warning about unresolved branches", async () => {
  const { code, warnings } = await compile(`${prefix}
    export const icon = <MdSymbol>{globalThis.paused ? "play_arrow" : globalThis.icon}</MdSymbol>;
  `);
  expect(code).toContain(`${symbolsUrl}&icon_names=play_arrow`);
  expect(warnings).toEqual([expect.stringContaining("dynamic MdSymbol children")]);
});

test("includes known symbols without a component and preserves the full font for empty builds", async () => {
  const known = await compile(`export const font = ${JSON.stringify(symbolsUrl)};`, ["check"]);
  expect(known.code).toContain(`${symbolsUrl}&icon_names=check`);
  const empty = await compile(`export const font = ${JSON.stringify(symbolsUrl)};`);
  expect(empty.code).toContain(symbolsUrl);
  expect(empty.code).not.toContain("icon_names");
});

test("normalizes registered symbols before deduplicating the font request", async () => {
  const { code, warnings } = await compile(prefix, [" check ", "check", "\n close\t"]);
  expect(code).toContain(`${symbolsUrl}&icon_names=check,close`);
  expect(warnings).toEqual([]);
});

test("rejects blank registered symbols", async () => {
  await expect(compile(prefix, [" \t\n"])).rejects.toThrow(
    "Registered Material Symbol names must not be empty or whitespace.",
  );
});

test("reports a source location for each unresolved use", async () => {
  const { warnings, warningLocations } = await compile(`${prefix}
    export const first = <MdSymbol>{globalThis.first}</MdSymbol>;
    export const second = <MdSymbol>{globalThis.second}</MdSymbol>;
  `);
  expect(warnings).toHaveLength(2);
  expect(warnings[0]).toContain("/symbol-fixture.tsx:5:");
  expect(warnings[1]).toContain("/symbol-fixture.tsx:6:");
  expect(warningLocations).toEqual([
    { file: "/symbol-fixture.tsx", line: 5, column: expect.any(Number) },
    { file: "/symbol-fixture.tsx", line: 6, column: expect.any(Number) },
  ]);
});

test("recognizes jsxDEV, jsxs, and classic createElement calls", async () => {
  const { code } = await compile(`${prefix}
    export const icons = [
      globalThis.jsxDEV(MdSymbol, {children: "check"}),
      globalThis.jsxs(MdSymbol, {children: "home"}),
      globalThis.React.createElement(MdSymbol, null, "close"),
    ];
  `);
  expect(code).toContain(`${symbolsUrl}&icon_names=check,close,home`);
});
