const pluralRules = new Intl.PluralRules("en-GB");

export type Plurals = readonly [count: number, one: string, other?: string];

/**
 * Pluralizes a string based on the provided count and forms.
 * @example
 * const result = pluralize`You have ${count} ${[count, "message"]}.`; // "You have 1 message."
 */
export function pluralize(strs: TemplateStringsArray, ...values: Array<string | number | Plurals>) {
  return strs.reduce((acc, str, i) => {
    const value = values[i];

    if (typeof value === "object") {
      const [count, one, other] = value;
      acc += str + (pluralRules.select(count) === "one" ? one : (other ?? `${one}s`));
    } else {
      acc += str + (value ?? "");
    }

    return acc;
  }, "");
}
