import type { Ref } from "react";
import { up } from "up-fetch";

export function capitalize<T extends string>(str: T): Capitalize<T> {
  // SAFETY: JavaScript Capitalize uppercases the first character, matching this transform.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

export const unsafeKeys: <T extends object>(obj: T) => Array<keyof T> = Object.keys;

export const unsafeEntries: <T extends object>(obj: T) => Array<[keyof T, T[keyof T]]> =
  Object.entries;

export const unsafeFromEntries: <
  const TEntries extends ReadonlyArray<readonly [PropertyKey, unknown]>,
>(
  entries: TEntries,
) => {
  -readonly [TEntry in TEntries[number] as TEntry[0]]: TEntry[1];
} = Object.fromEntries;

// oxlint-disable-next-line anti-slop/no-object-parameters -- This reflection helper intentionally accepts any object.
const enumerableKeys = (obj: object) =>
  Reflect.ownKeys(obj).filter((key) => Object.getOwnPropertyDescriptor(obj, key)?.enumerable);

/** A manually resolved promise that also resolves on disposal to release waiting work. */
export function disposablePromise() {
  const promise = Promise.withResolvers<void>();

  return { ...promise, [Symbol.dispose]: () => promise.resolve() };
}

export const promiseAllKeyed = async <T extends Record<PropertyKey, unknown>>(
  keyed: T,
): Promise<{
  [K in keyof T]: Awaited<T[K]>;
}> => {
  const entries = await Promise.all(
    enumerableKeys(keyed).map(async (key) => [key, await keyed[key]] as const),
  );

  // SAFETY: Every output pair retains its source key and the awaited value read from that key.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unsafeFromEntries(entries) as never;
};

export const promiseAllSettledKeyed = async <T extends Record<PropertyKey, unknown>>(
  keyed: T,
): Promise<{
  [K in keyof T]: PromiseSettledResult<Awaited<T[K]>>;
}> => {
  const keys = enumerableKeys(keyed);
  const results = await Promise.allSettled(keys.map((key) => keyed[key]));

  const entries = keys.map((key, index) => {
    const result = results[index];
    assert(result, "Missing settled result for enumerable key.");

    return [key, result] as const;
  });

  // SAFETY: Each settled result is paired with the same key used to read its promise.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unsafeFromEntries(entries) as never;
};

export const anyAbortSignal = (...signals: Array<AbortSignal | undefined>): AbortSignal =>
  AbortSignal.any(signals.filter((x) => !!x));

export const upfetch = up(fetch);

type CodeLanguage = "css" | "esquery" | "js" | "regex" | "ts" | "tsx";

// SAFETY: The proxy getter supplies String.raw for every supported language key.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The get trap guarantees every language key.
const codeTarget = {} as Record<CodeLanguage, typeof String.raw>;

/**
 * A utility object for generating code strings, particularly for regular expressions.
 * Accessing a supported language key on this object returns `String.raw`.
 * The main benefit is IDEs will use the key to achieve syntax highlighting and autocompletion for the code strings.
 * @example
 * const code = code.ts`const foo = "bar"`;
 * const styles = code.css`body { color: red; }`;
 */
export const code = new Proxy(codeTarget, {
  get() {
    return String.raw;
  },
});

export function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

export function mergeRefs<T>(...refs: Array<Ref<T> | null | undefined>) {
  return (instance: T | null) => {
    const cleanups: Array<() => void> = [];

    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === "function") {
        const cleanup = ref(instance);
        cleanups.push(
          typeof cleanup === "function"
            ? cleanup
            : () => {
                ref(null);
              },
        );
      } else {
        ref.current = instance;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
