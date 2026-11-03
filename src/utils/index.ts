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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return unsafeFromEntries(results.map((result, i) => [keys[i], result])) as never;
};
