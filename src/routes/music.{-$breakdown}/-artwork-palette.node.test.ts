import { argbFromHex, Contrast, Hct } from "@material/material-color-utilities";
import { http, HttpResponse } from "msw";
import sharp from "sharp";
import { network } from "virtual:msw";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import { addArtworkPalettes } from "./-artwork-palette.server";
import type { ArtworkPalette, SpotifyArtwork } from "./-query";

function track(src?: string): {
  name: string;
  artwork?: SpotifyArtwork;
  palette?: ArtworkPalette;
} {
  return {
    name: "Example song",
    artwork: src
      ? { imageUrl: src, spotifyUrl: "https://open.spotify.com/track/example" }
      : undefined,
  };
}

test.each([
  { background: "#ca2020", src: "https://i.scdn.co/image/palette-red" },
  { background: "#2040ca", src: "https://i.scdn.co/image/palette-blue" },
  { background: "#777777", src: "https://i.scdn.co/image/palette-gray" },
])("generates and caches readable artwork palettes from $src", async ({ background, src }) => {
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background },
  })
    .png()
    .toBuffer();
  let requests = 0;
  network.use(
    http.get(src, () => {
      requests++;
      return new HttpResponse(new Uint8Array(image), {
        headers: { "Content-Type": "image/png" },
      });
    }),
  );
  const tracks = await addArtworkPalettes([track(src), track(src)], new AbortController().signal);
  const palette = tracks[0]?.palette;
  expect(palette).toBeDefined();
  expect(tracks[1]?.palette).toEqual(palette);
  await addArtworkPalettes([track(src)], new AbortController().signal);
  expect(requests).toBe(1);
  for (const [level, target] of [
    ["standard", 4.5],
    ["medium", 6],
    ["high", 7],
  ] as const) {
    const colors = (role: string) => {
      const value = palette?.[`--artwork-${level}-${role}`];
      const match = /^light-dark\((#[\da-f]{6}), (#[\da-f]{6})\)$/.exec(value ?? "");
      if (!match?.[1] || !match[2]) throw new Error(`Missing artwork color ${role}`);
      return [match[1], match[2]].map((hex) => Hct.fromInt(argbFromHex(hex)));
    };
    const surfaces = colors("surface");
    for (const role of ["on-surface", "on-surface-variant", "primary", "secondary", "tertiary"]) {
      colors(role).forEach((color, index) => {
        const surface = surfaces[index];
        if (!surface) throw new Error("Missing artwork surface");
        expect(Contrast.ratioOfTones(color.tone, surface.tone)).toBeGreaterThanOrEqual(target);
      });
    }
  }
});

test("generates artwork palettes for ranked artists", async () => {
  const src = "https://i.scdn.co/image/radiohead-palette";
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background: "#2040ca" },
  })
    .png()
    .toBuffer();
  network.use(
    http.get(
      src,
      () =>
        new HttpResponse(new Uint8Array(image), {
          headers: { "Content-Type": "image/png" },
        }),
    ),
  );

  const [artist] = await addArtworkPalettes(
    [
      {
        name: "Radiohead",
        artwork: {
          imageUrl: src,
          spotifyUrl: "https://open.spotify.com/artist/radiohead",
        },
      },
    ],
    new AbortController().signal,
  );

  expect(artist?.palette).toBeDefined();
});

test("keeps tracks with missing or failed artwork and reports extraction errors", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  const src = "https://i.scdn.co/image/unavailable.png";
  network.use(http.get(src, () => new HttpResponse(null, { status: 404 })));
  const tracks = [track(), track(src)];
  expect(await addArtworkPalettes(tracks, new AbortController().signal)).toEqual(tracks);
  expect(tracks.map((item) => item.palette)).toEqual([undefined, undefined]);
  expect(warning).toHaveBeenCalledOnce();
});

test.each([
  "https://example.com/image.png",
  "http://example.com/image.png",
  "https://user:password@example.com/image.png",
  "https://example.com:8443/image.png",
  "https://127.0.0.1/image.png",
  "https://10.0.0.1/image.png",
  "https://[::1]/image.png",
  "https://localhost/image.png",
  "https://i.scdn.co.evil.example/image.png",
])("does not fetch an unsupported artwork URL: %s", async (src) => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let requests = 0;
  network.use(
    http.get("*", () => {
      requests++;
      return new HttpResponse(null, { status: 500 });
    }),
  );
  await addArtworkPalettes([track(src)], new AbortController().signal);
  expect(requests).toBe(0);
  expect(warning).toHaveBeenCalledOnce();
});

test.each(["corrupt", "oversized", "redirect"])(
  "rejects %s artwork without losing listening history",
  async (kind) => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warning.mockRestore());
    const src = `https://i.scdn.co/image/${kind}.png`;
    network.use(
      http.get(src, () =>
        kind === "redirect"
          ? HttpResponse.redirect("https://example.com/artwork.png")
          : new HttpResponse(
              kind === "oversized" ? new Uint8Array(1_000_001) : new Uint8Array([1, 2, 3]),
              { headers: { "Content-Type": "image/png" } },
            ),
      ),
    );
    const [result] = await addArtworkPalettes([track(src)], new AbortController().signal);
    expect(result?.name).toBe("Example song");
    expect(result?.palette).toBeUndefined();
    expect(warning).toHaveBeenCalledOnce();
  },
);

test("propagates request cancellation instead of returning unthemed success", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(addArtworkPalettes([track()], controller.signal)).rejects.toThrow(
    "This operation was aborted",
  );
});
