import { combineSlices } from "@reduxjs/toolkit";

import { snackbarSlice } from "#/shared/lib/snackbar";

export const rootReducer = combineSlices(snackbarSlice);
