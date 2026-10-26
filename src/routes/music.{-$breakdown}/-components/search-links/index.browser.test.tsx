import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicSearchLinks } from "./index";

test("encodes track and artist names in both search destinations", async () => {
  const name = "Love / Hate? #1";
  const artist = "Björk & friends";
  const query = `${name} ${artist}`;
  const result = await page.renderWithProviders(<MusicSearchLinks name={name} artist={artist} />);
  for (const provider of ["Spotify", "YouTube"]) {
    const link = result.getByRole("link", { name: `Search ${provider} for ${query}` });
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect
    .element(result.getByRole("link", { name: `Search Spotify for ${query}` }))
    .toHaveAttribute("href", `https://open.spotify.com/search/${encodeURIComponent(query)}`);
  await expect
    .element(result.getByRole("link", { name: `Search YouTube for ${query}` }))
    .toHaveAttribute(
      "href",
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    );
});

test("searches for just the artist when no track artist is supplied", async () => {
  const result = await page.renderWithProviders(<MusicSearchLinks name="Radiohead" />);
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Radiohead" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Radiohead");
  await expect
    .element(result.getByRole("link", { name: "Search YouTube for Radiohead" }))
    .toHaveAttribute("href", "https://www.youtube.com/results?search_query=Radiohead");
});
