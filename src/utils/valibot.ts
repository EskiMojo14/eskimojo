import * as v from "valibot";

export const coerceNumber = v.pipe(v.any(), v.toNumber());

export const coerceDate = v.pipe(v.union([v.string(), v.number(), v.date()]), v.toDate());

export const json = <T extends v.GenericSchema>(
  schema: T,
  reviver?: v.ParseJsonConfig["reviver"],
) => v.pipe(v.string(), v.parseJson({ reviver }), schema);

export const maybeJson = <T extends v.GenericSchema>(schema: T) => v.union([schema, json(schema)]);
