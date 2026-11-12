import { expect, test } from "vite-plus/test";

import { clearSnackbars, dismissSnackbar, showSnackbar, snackbarStore } from "./snackbar";

test("server-side calls are no-ops and never queue notifications", () => {
  expect(showSnackbar("Saved")).toBeUndefined();
  expect(
    showSnackbar({
      message: "Removed",
      action: {
        label: "Undo",
        onClick: () => {
          throw new Error("Must not execute on server");
        },
      },
    }),
  ).toBeUndefined();
  expect(dismissSnackbar("id")).toBeUndefined();
  expect(clearSnackbars()).toBeUndefined();
  expect(snackbarStore.get()).toEqual([]);
});
