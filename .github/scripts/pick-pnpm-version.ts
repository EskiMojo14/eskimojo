import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const raw = execFileSync("npm", ["view", "pnpm", "time", "--json"], {
  encoding: "utf8",
});
const time: unknown = JSON.parse(raw);
if (typeof time !== "object" || time === null || Array.isArray(time)) {
  throw new Error("Could not read pnpm publication times");
}

const cutoffValue = process.env.CUTOFF;
if (!cutoffValue || Number.isNaN(new Date(cutoffValue).getTime())) {
  throw new Error("CUTOFF must be a valid date");
}
const cutoff = new Date(cutoffValue);

const versions = Object.entries(time)
  .flatMap(([version, publishedAt]) => {
    if (
      version === "created" ||
      version === "modified" ||
      version.includes("-") ||
      !version.startsWith("12.")
    ) {
      return [];
    }

    if (typeof publishedAt !== "string") return [];

    const publishedDate = new Date(publishedAt);
    if (Number.isNaN(publishedDate.getTime())) return [];

    return [{ version, publishedDate }];
  })
  .toSorted((left, right) => right.publishedDate.getTime() - left.publishedDate.getTime());

const selected = versions.find((entry) => entry.publishedDate <= cutoff);
if (!selected) {
  throw new Error(`No pnpm version found older than cutoff ${cutoffValue}`);
}

const publishedAt = selected.publishedDate.toISOString();
process.stdout.write(`Selected pnpm ${selected.version} (published ${publishedAt})\n`);

const outputPath = process.env.GITHUB_OUTPUT;
if (!outputPath) throw new Error("GITHUB_OUTPUT is required");

appendFileSync(
  outputPath,
  [`version=${selected.version}`, `published_at=${publishedAt}`, ""].join("\n"),
);
