// oxlint-disable-next-line typescript/no-redundant-type-constituents
export type Compute<T> = { [K in keyof T]: T[K] } & unknown;
