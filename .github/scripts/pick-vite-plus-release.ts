import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

type VersionParts = [number, number, number];

const parseVersion = (version: string): VersionParts | null => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return null;

  const [major, minor, patch] = version.split(".");
  return [Number(major), Number(minor), Number(patch)];
};

const compareVersions = (left: VersionParts, right: VersionParts): number => {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }

  return 0;
};

const readJson = (command: string, args: Array<string>): unknown =>
  JSON.parse(execFileSync(command, args, { encoding: "utf8" }));

const toolchain = readJson("vp", ["toolchain", "--json"]);
if (typeof toolchain !== "object" || toolchain === null || !("source" in toolchain)) {
  throw new Error("Could not determine the current Vite+ version");
}

const source = toolchain.source;
if (typeof source !== "object" || source === null || !("vitePlusVersion" in source)) {
  throw new Error("Could not determine the current Vite+ version");
}

const currentVersion = source.vitePlusVersion;
const currentVersionParts =
  typeof currentVersion === "string" ? parseVersion(currentVersion) : null;
if (typeof currentVersion !== "string" || !currentVersionParts) {
  throw new Error("Could not determine the current stable Vite+ version");
}

const publishedVersionsData = readJson("npm", ["view", "vite-plus", "versions", "--json"]);
if (
  !Array.isArray(publishedVersionsData) ||
  !publishedVersionsData.every((version) => typeof version === "string")
) {
  throw new Error("Could not read published Vite+ versions");
}
const publishedVersions = new Set(publishedVersionsData);

const times = readJson("npm", ["view", "vite-plus", "time", "--json"]);
if (typeof times !== "object" || times === null || Array.isArray(times)) {
  throw new Error("Could not read Vite+ release publication times");
}

const cutoffValue = process.env.CUTOFF;
if (!cutoffValue || Number.isNaN(new Date(cutoffValue).getTime())) {
  throw new Error("CUTOFF must be a valid date");
}
const cutoff = new Date(cutoffValue);

const eligible = Object.entries(times)
  .flatMap(([version, publishedAt]) => {
    const versionParts = parseVersion(version);
    if (!publishedVersions.has(version) || !versionParts || typeof publishedAt !== "string")
      return [];

    const publishedDate = new Date(publishedAt);
    if (
      Number.isNaN(publishedDate.getTime()) ||
      compareVersions(versionParts, currentVersionParts) <= 0 ||
      publishedDate > cutoff
    )
      return [];

    return [{ version, versionParts, publishedAt }];
  })
  .toSorted((left, right) => compareVersions(right.versionParts, left.versionParts));

const outputPath = process.env.GITHUB_OUTPUT;
if (!outputPath) throw new Error("GITHUB_OUTPUT is required");

const selected = eligible[0];
if (!selected) {
  process.stdout.write(
    `No stable Vite+ release newer than ${currentVersion} is at least 24 hours old.\n`,
  );
  appendFileSync(outputPath, "version=\n\n");
  process.exit(0);
}

const { version, publishedAt } = selected;
process.stdout.write(
  `Selected Vite+ ${version} (published ${publishedAt}) over ${currentVersion}\n`,
);
appendFileSync(
  outputPath,
  [
    `version=${version}`,
    `published_at=${publishedAt}`,
    `current_version=${currentVersion}`,
    "",
  ].join("\n"),
);
