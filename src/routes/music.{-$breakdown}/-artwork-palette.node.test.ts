import { argbFromHex, Contrast, Hct } from "@material/material-color-utilities";
import { http, HttpResponse } from "msw";
import sharp from "sharp";
import { network } from "virtual:msw";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import { addArtworkPalettes } from "./-artwork-palette.server";
import type { RecentTrack } from "./-query";

function track(src?: string): RecentTrack {
  return {
    name: "Example song",
    artist: "Example artist",
    album: "Example album",
    image: src ? { extralarge: src } : {},
    nowPlaying: true,
  };
}

test.each([
  {
    background: "#ca2020",
    src: "https://lastfm-img.freetls.fastly.net/i/u/300x300/palette-red.png",
  },
  { background: "#2040ca", src: "https://i.scdn.co/image/palette-blue" },
  { background: "#777777", src: "https://example.com/cover-gray.png" },
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

test("keeps tracks with missing or failed artwork and reports extraction errors", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  const src = "https://lastfm.freetls.fastly.net/i/u/300x300/unavailable.png";
  network.use(http.get(src, () => new HttpResponse(null, { status: 404 })));
  const tracks = [track(), track(src)];
  expect(await addArtworkPalettes(tracks, new AbortController().signal)).toEqual(tracks);
  expect(tracks.map((item) => item.palette)).toEqual([undefined, undefined]);
  expect(warning).toHaveBeenCalledOnce();
});

test.each([
  "http://example.com/image.png",
  "https://user:password@example.com/image.png",
  "https://example.com:8443/image.png",
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
    const src = `https://lastfm.freetls.fastly.net/i/u/300x300/${kind}.png`;
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
