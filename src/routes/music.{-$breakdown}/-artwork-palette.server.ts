import { hexFromArgb } from "@material/material-color-utilities";

import { imageSourceColor, imageColorScheme, readableImageColor } from "#/shared/lib/image-palette";

import type { ArtworkPalette, SpotifyArtwork } from "./-query";

const cache = new Map<string, { palette: ArtworkPalette; expires: number }>();
const artworkHost = "i.scdn.co";
const maxArtworkBytes = 1_000_000;

async function downloadArtwork(src: string, signal: AbortSignal) {
  const url = new URL(src);
  if (
    url.protocol !== "https:" ||
    url.hostname !== artworkHost ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error(
      `Artwork palette requires an HTTPS image URL hosted on ${artworkHost} without credentials or a custom port`,
    );
  }
  const response = await fetch(url, { signal, redirect: "error" });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Artwork request failed (${response.status})`);
  }
  if (!response.headers.get("content-type")?.startsWith("image/")) {
    await response.body?.cancel();
    throw new Error("Artwork response is not an image");
  }
  if (Number(response.headers.get("content-length")) > maxArtworkBytes) {
    await response.body?.cancel();
    throw new Error("Artwork exceeds download limit");
  }
  if (!response.body) throw new Error("Artwork response has no body");
  const reader = response.body.getReader();
  const chunks: Array<Uint8Array> = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxArtworkBytes) throw new Error("Artwork exceeds download limit");
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

async function artworkPalette(src: string, signal: AbortSignal) {
  const cached = cache.get(src);
  if (cached && cached.expires > Date.now()) return cached.palette;
  const bytes = await downloadArtwork(src, signal);
  const source = await imageSourceColor(bytes);
  signal.throwIfAborted();
  const palette: ArtworkPalette = {};
  for (const [level, contrast, target] of [
    ["standard", 0, 4.5],
    ["medium", 0.5, 6],
    ["high", 1, 7],
  ] as const) {
    const colors = [false, true].map((isDark): Record<string, string> => {
      const scheme = imageColorScheme(source, isDark, contrast);
      const background = scheme.surfaceContainer;
      return {
        surface: hexFromArgb(background),
        "on-surface": readableImageColor(scheme.onSurface, background, target, isDark),
        "on-surface-variant": readableImageColor(
          scheme.onSurfaceVariant,
          background,
          target,
          isDark,
        ),
        primary: readableImageColor(scheme.primary, background, target, isDark),
        secondary: readableImageColor(scheme.secondary, background, target, isDark),
        tertiary: readableImageColor(scheme.tertiary, background, target, isDark),
      };
    });
    const [light, dark] = colors;
    if (!light || !dark) throw new Error("Missing artwork color scheme");
    for (const [role, value] of Object.entries(light)) {
      const darkValue = dark[role];
      if (!darkValue) throw new Error(`Missing dark artwork color for ${role}`);
      palette[`--artwork-${level}-${role}`] = `light-dark(${value}, ${darkValue})`;
    }
  }
  cache.delete(src);
  cache.set(src, { palette, expires: Date.now() + 24 * 60 * 60 * 1000 });
  if (cache.size > 128) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return palette;
}

export async function addArtworkPalettes<
  T extends { artwork?: SpotifyArtwork; palette?: ArtworkPalette },
>(items: Array<T>, signal: AbortSignal): Promise<Array<T & { palette?: ArtworkPalette }>> {
  const extractionSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
  const pending = new Map<string, Promise<ArtworkPalette | undefined>>();
  const palettes: Array<ArtworkPalette | undefined> = Array.from(
    { length: items.length },
    () => undefined,
  );
  const queue = items.entries();
  await Promise.all(
    Array.from({ length: Math.min(4, items.length) }, async () => {
      for (const [index, item] of queue) {
        signal.throwIfAborted();
        const src = item.artwork?.imageUrl;
        if (!src) continue;
        let palette = pending.get(src);
        if (!palette) {
          palette = artworkPalette(src, extractionSignal).catch((error: unknown) => {
            signal.throwIfAborted();
            console.warn("Could not generate music artwork palette.", error);
            return undefined;
          });
          pending.set(src, palette);
        }
        palettes[index] = await palette;
      }
    }),
  );
  return items.map((item, index) => {
    const palette = palettes[index];
    return palette ? { ...item, palette } : item;
  });
}
