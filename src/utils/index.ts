import { up } from "up-fetch";

export function capitalize<T extends string>(str: T): Capitalize<T> {
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
}> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  unsafeFromEntries(
    await Promise.all(enumerableKeys(keyed).map(async (key) => [key, await keyed[key]])),
  ) as never;

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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unsafeFromEntries(entries) as never;
};

export const anyAbortSignal = (...signals: Array<AbortSignal | undefined>): AbortSignal =>
  AbortSignal.any(signals.filter((x) => !!x));

export const upfetch = up(fetch);

type CodeLanguage = "css" | "esquery" | "js" | "regex" | "ts";

// The proxy getter supplies every supported key while keeping the target empty.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The get trap below guarantees every language key.
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
