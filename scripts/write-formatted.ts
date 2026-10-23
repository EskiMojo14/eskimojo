import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { format } from "vite-plus/fmt";

import fmtConfig from "../config/fmt.config.ts";

// format() takes only formatting options; these keys choose which files to format.
const { ignorePatterns: _, overrides: __, associations: ___, ...options } = fmtConfig;

/** Formats `contents` with oxfmt (as `vp fmt` would) and writes it to `url`. */
export async function writeFormatted(url: URL, contents: string): Promise<void> {
  const path = fileURLToPath(url);
  const { code, errors } = await format(path, contents, options);
  if (errors.length > 0) {
    throw new Error(`Couldn't format ${path}:\n${errors.map((error) => error.message).join("\n")}`);
  }
  await writeFile(path, code);
  console.log(`Wrote ${path}`);
}
