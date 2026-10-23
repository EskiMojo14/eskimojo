import { expect } from "vite-plus/test";
import "mix-n-matchers/vitest";

expect.ref = (refObject, pollOptions) => expect.poll(() => refObject.current, pollOptions);

declare module "vitest" {
  interface ExpectStatic {
    ref<T>(
      refObject: { current: T },
      pollOptions?: ExpectPollOptions,
    ): ReturnType<typeof expect.poll<T>>;
  }
}
