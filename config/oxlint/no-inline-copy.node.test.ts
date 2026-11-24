import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { RuleTester } from "vite-plus/lint/plugins-dev";
import { describe, expect, it, onTestFinished, test } from "vite-plus/test";

import { code } from "#/utils";

import { noInlineCopy } from "./no-inline-copy";

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "tsx" } } });
const backtick = "`";
const queryExpression = "${query}";

tester.run("no-inline-copy", noInlineCopy, {
  valid: [
    code.tsx`<button>{copy.save}</button>`,
    code.tsx`<img alt="" src="/image.png" />`,
    code.tsx`<MdSymbol>arrow_forward</MdSymbol>`,
    code.tsx`<MdSymbol>{"arrow_forward"}</MdSymbol>`,
    code.tsx`<span>{copy.name}{" "}{copy.handle}.</span>`,
    code.tsx`<button className="button" type="button" aria-label={copy.label} />`,
    code.tsx`<button aria-label={enabled ? copy.on : copy.off} />`,
    code.tsx`<button aria-label={kind === "primary" ? copy.primary : copy.secondary} />`,
  ],
  invalid: [
    { code: code.tsx`<button>Save</button>`, errors: [{ messageId: "inlineCopy" }] },
    { code: code.tsx`<button aria-label="Close" />`, errors: [{ messageId: "inlineCopy" }] },
    { code: code.tsx`<img alt="A cat" />`, errors: [{ messageId: "inlineCopy" }] },
    {
      code: code.tsx`<EmptyState title="Not found" description="Try again" />`,
      errors: [{ messageId: "inlineCopy" }, { messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`<button aria-label={enabled ? "Pause" : "Resume"} />`,
      errors: [{ messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`<button aria-label={enabled && "Pause"} />`,
      errors: [{ messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`<button aria-label={name ?? "Unknown"} />`,
      errors: [{ messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`<button aria-label={${backtick}Search for ${queryExpression}${backtick}} />`,
      errors: [{ messageId: "inlineCopy" }],
    },
    { code: code.tsx`<p>{"Welcome"}</p>`, errors: [{ messageId: "inlineCopy" }] },
    { code: code.tsx`<p>{"Hello " + name}</p>`, errors: [{ messageId: "inlineCopy" }] },
    {
      code: code.tsx`<p>{count === 1 ? "One result" : "Many results"}</p>`,
      errors: [{ messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`<MdSymbol aria-label="Next">skip_next</MdSymbol>`,
      errors: [{ messageId: "inlineCopy" }],
    },
  ],
});

test("warns for home components but not copy modules, tests, or stories", async () => {
  const directory = await mkdtemp(path.resolve("src/routes/_home/-inline-copy-test-"));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  const component = path.join(directory, "component.tsx");
  const copyFile = path.join(directory, "-copy.tsx");
  const story = path.join(directory, "component.stories.tsx");
  const testFile = path.join(directory, "component.browser.test.tsx");

  await Promise.all([
    writeFile(
      component,
      code.tsx`export const component = <button aria-label="Close">Save</button>;`,
    ),
    writeFile(copyFile, code.tsx`export const copy = <>Copy in the catalogue</>;`),
    writeFile(story, code.tsx`export const story = <button>Story copy</button>;`),
    writeFile(testFile, code.tsx`export const fixture = <button>Test copy</button>;`),
  ]);

  const { stdout, stderr } = await promisify(execFile)("vp", [
    "lint",
    component,
    copyFile,
    story,
    testFile,
  ]);

  const output = stdout + stderr;

  expect(output.match(/eskimojo\(no-inline-copy\)/g)).toHaveLength(2);
  expect(output).toContain("component.tsx:");
  expect(output).not.toContain("-copy.tsx:");
  expect(output).not.toContain("component.stories.tsx:");
  expect(output).not.toContain("component.browser.test.tsx:");
});
