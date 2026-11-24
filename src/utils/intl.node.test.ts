import { expect, test } from "vite-plus/test";

import { pluralize } from "./intl";

test("preserves text and interpolates strings, numbers, and multiple plural forms", () => {
  const name = "Alex";
  const messages = 1;
  const replies = 0;

  expect(
    pluralize`${name} has ${messages} ${[messages, "message"]} and ${replies} ${[replies, "reply", "replies"]}.`,
  ).toBe("Alex has 1 message and 0 replies.");
  expect(pluralize`No interpolations.`).toBe("No interpolations.");
});

test.each([
  [0, "0 messages"],
  [1, "1 message"],
  [2, "2 messages"],
  [1.5, "1.5 messages"],
  [-1, "-1 message"],
])("selects the English form for %s", (count, expected) => {
  expect(pluralize`${count} ${[count, "message"]}`).toBe(expected);
});

test("uses an explicitly supplied irregular plural", () => {
  const people = [2, "person", "people"] as const;

  expect(pluralize`${1} ${[1, "person", "people"]}`).toBe("1 person");
  expect(pluralize`${2} ${people}`).toBe("2 people");
});

test("preserves an explicitly empty plural form", () => {
  expect(pluralize`Item${[2, "!", ""]}.`).toBe("Item.");
});
