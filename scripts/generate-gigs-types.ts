import { fileURLToPath } from "node:url";

import { compileFromFile } from "json-schema-to-typescript";

import { writeFormatted } from "./write-formatted.ts";

const schema = new URL("../src/routes/gigs/-data/gigs.schema.json", import.meta.url);
const output = new URL("../src/routes/gigs/-data/gigs.gen.ts", import.meta.url);

const types = await compileFromFile(fileURLToPath(schema), {
  bannerComment: "/* Generated from gigs.schema.json. Do not edit by hand. */",
});

await writeFormatted(output, types);
