import { vi } from "vite-plus/test";

type Transition = ReturnType<Document["startViewTransition"]>;

export function observeViewTransitions() {
  const completed: Array<Transition> = [];
  const waiting: Array<(transition: Transition) => void> = [];
  const original = document.startViewTransition.bind(document);

  const spy = vi.spyOn(document, "startViewTransition").mockImplementation((update) => {
    const transition = original(update);
    const resolve = waiting.shift();

    if (resolve) resolve(transition);
    else completed.push(transition);

    return transition;
  });

  return {
    spy,
    next() {
      const transition = completed.shift();

      if (transition) return Promise.resolve(transition);

      return new Promise<Transition>((resolve) => waiting.push(resolve));
    },
  };
}
