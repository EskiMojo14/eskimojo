import * as v from "valibot";

export const projectKindSchema = v.picklist(["project", "package", "contribution"]);
export type ProjectKind = v.InferOutput<typeof projectKindSchema>;
