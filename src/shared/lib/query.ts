import { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { radEventListeners } from "rad-event-listeners";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });
}

export const preloadImage = createIsomorphicFn()
  .client((src: string) => {
    const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
    const img = new Image();
    img.fetchPriority = "low";
    radEventListeners(img, {
      load: () => resolve(img),
      error: (err) => reject(err),
    });
    img.src = src;
    return promise;
  })
  .server(() => Promise.resolve());
