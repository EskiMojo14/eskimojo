import { spawnSync } from "node:child_process";

const sourceFilePattern = /\.(?:ts|tsx|mdx)$/;
const projectConfigPattern = /^config\/tsconfig\..*\.json$/;

const diff = spawnSync("git", ["diff", "--cached", "--name-only", "-z"], {
  encoding: "utf8",
});
if (diff.error) throw diff.error;
if (diff.status !== 0) {
  process.stderr.write(diff.stderr);
  process.exit(diff.status ?? 1);
}

const files = diff.stdout.split("\0").filter(Boolean);
const typecheckInputs = new Set([
  "tsconfig.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);
const needsTypecheck = files.some(
  (file) =>
    sourceFilePattern.test(file) || projectConfigPattern.test(file) || typecheckInputs.has(file),
);
if (needsTypecheck) {
  const check = spawnSync("vp", ["run", "typecheck"], { stdio: "inherit" });
  if (check.error) throw check.error;
  process.exit(check.status ?? 1);
} else {
  console.log("Skipping type check: no staged code, MDX, configuration, or dependency changes.");
}
