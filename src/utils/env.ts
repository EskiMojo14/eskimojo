import { createMiddleware } from "@tanstack/react-start";
import * as v from "valibot";

function parseEnv<T extends v.GenericSchema>(
  schema: T,
  // some bundlers replace each process.env variable with a static string at build time, so we pass them explicitly here
  env: Record<keyof v.InferInput<T>, string | undefined>,
) {
  return v.parse(schema, env);
}

export const serverEnvSchema = v.object({
  LASTFM_API_KEY: v.string(),
  // LASTFM_SECRET: v.string(),
  LASTFM_USER: v.string(),
});

export const withServerEnv = createMiddleware().server(({ next }) =>
  next({
    context: {
      serverEnv: parseEnv(serverEnvSchema, {
        LASTFM_API_KEY: process.env.LASTFM_API_KEY,
        // LASTFM_SECRET: process.env.LASTFM_SECRET,
        LASTFM_USER: process.env.LASTFM_USER,
      }),
    },
  }),
);
