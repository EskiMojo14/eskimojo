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
    code.tsx`generatePageMetadata(copy.meta)`,
    code.tsx`generatePageMetadata({ title: copy.title, description: copy.description, image: { url: "/logo.png", alt: copy.alt } })`,
    code.tsx`createFileRoute("/projects")({ staticData: { title: copy.title, backLink: { to: "/projects", label: copy.back } } })`,
    code.tsx`const unrelated = { staticData: { title: "Internal" }, title: "Internal" }`,
    code.tsx`otherFunction({ title: "Internal", description: "Internal" })`,
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
    {
      code: code.tsx`generatePageMetadata({ title: "Projects", description: "Explore projects." })`,
      errors: [{ messageId: "inlineCopy" }, { messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`generatePageMetadata({ title: project.title ?? "Project", description: copy.description, image: project.logo ? { url: project.logo, alt: ${backtick}${queryExpression} logo${backtick} } : undefined })`,
      errors: [{ messageId: "inlineCopy" }, { messageId: "inlineCopy" }],
    },
    {
      code: code.tsx`createFileRoute("/projects")({ staticData: { title: "Projects", subtitle: "My work", backLink: { to: "/projects", label: "Back to projects" } } })`,
      errors: [
        { messageId: "inlineCopy" },
        { messageId: "inlineCopy" },
        { messageId: "inlineCopy" },
      ],
    },
    {
      code: code.tsx`createRootRouteWithContext<Context>()({ staticData: { title: "Site" } })`,
      errors: [{ messageId: "inlineCopy" }],
    },
  ],
});

test.each(["_home", "projects"])(
  "warns for %s components and metadata but not copy modules, tests, or stories",
  async (route) => {
    const directory = await mkdtemp(path.resolve(`src/routes/${route}/-inline-copy-test-`));

    onTestFinished(() => rm(directory, { recursive: true, force: true }));

    const component = path.join(directory, "component.tsx");
    const copyFile = path.join(directory, "-copy.tsx");
    const story = path.join(directory, "component.stories.tsx");
    const testFile = path.join(directory, "component.browser.test.tsx");

    await Promise.all([
      writeFile(
        component,
        code.tsx`
        import { createFileRoute } from "@tanstack/react-router";
        import { generatePageMetadata } from "#/shared/lib/document-head";

        export const Route = createFileRoute("/")({
          staticData: { title: "Home" },
          head: () => generatePageMetadata({ title: "Home", description: "Home page" }),
        });

        export const component = <button aria-label="Close">Save</button>;
      `,
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

    expect(output.match(/eskimojo\(no-inline-copy\)/g)).toHaveLength(5);
    expect(output).toContain("component.tsx:");
    expect(output).not.toContain("-copy.tsx:");
    expect(output).not.toContain("component.stories.tsx:");
    expect(output).not.toContain("component.browser.test.tsx:");
  },
);
