import { expect, test, vi } from "vite-plus/test";

import { generatePageMetadata, getDocumentHead } from "./document-head";

vi.mock("#/shared/styles/index.css?url", () => ({ default: "/assets/app.css" }));

test.each(["Home", "Projects", "Music", "Gigs"])(
  "generates descriptions and social preview images for %s",
  (title) => {
    const description = `${title} page description`;
    const { meta } = generatePageMetadata({ title, description });

    expect(meta).toEqual(
      expect.arrayContaining([
        { title: `${title} | eskimojo` },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "eskimojo" },
        { property: "og:description", content: description },
        { property: "og:image", content: "https://eskimojo.dev/sources/Goat_square-1.jpeg" },
        { property: "og:image:width", content: "712" },
        { property: "og:image:height", content: "712" },
        { property: "og:image:alt", content: "eskimojo's Goat portrait" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://eskimojo.dev/sources/Goat_square-1.jpeg" },
        { name: "twitter:image:alt", content: "eskimojo's Goat portrait" },
      ]),
    );
  },
);

test("uses a project logo for social previews without inheriting the portrait dimensions", () => {
  const { meta } = generatePageMetadata({
    title: "Redux",
    description: "Predictable and maintainable global state management",
    image: { url: "/projects/redux.png", alt: "Redux logo" },
  });

  expect(meta).toEqual(
    expect.arrayContaining([
      { property: "og:image", content: "https://eskimojo.dev/projects/redux.png" },
      { property: "og:image:alt", content: "Redux logo" },
      { name: "twitter:image", content: "https://eskimojo.dev/projects/redux.png" },
      { name: "twitter:image:alt", content: "Redux logo" },
    ]),
  );
  expect(meta).not.toContainEqual(expect.objectContaining({ property: "og:image:width" }));
  expect(meta).not.toContainEqual(expect.objectContaining({ property: "og:image:height" }));
});

test("preserves the default document metadata and stylesheet links", () => {
  const { meta, links } = getDocumentHead();

  expect(meta).toEqual(
    expect.arrayContaining([
      { title: "eskimojo" },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ]),
  );
  expect(links).toEqual(
    expect.arrayContaining([
      {
        rel: "preload",
        href: "/OC-sidebar.webp",
        as: "image",
        fetchPriority: "low",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "64x64" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      expect.objectContaining({ rel: "stylesheet", crossOrigin: "anonymous" }),
      { rel: "stylesheet", href: "/assets/app.css" },
    ]),
  );
});

test("uses the Arctic portrait as the favicon for the Arctic palette", () => {
  const { links } = getDocumentHead("arctic");

  expect(links).toContainEqual({
    rel: "preload",
    href: "/Goat-sidebar.webp",
    as: "image",
    fetchPriority: "low",
  });
  expect(links).toContainEqual({
    rel: "icon",
    href: "/favicon-arctic.png",
    type: "image/png",
    sizes: "64x64",
  });
});
