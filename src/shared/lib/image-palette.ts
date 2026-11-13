import {
  argbFromRgb,
  Contrast,
  Hct,
  hexFromArgb,
  QuantizerMap,
  SchemeMonochrome,
  SchemeTonalSpot,
  Score,
} from "@material/material-color-utilities";
import sharp from "sharp";

export async function imageSourceColor(input: string | Buffer) {
  const bytes = await sharp(input, { limitInputPixels: 4_000_000, animated: false })
    .timeout({ seconds: 2 })
    .resize(128, 128, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer();
  const pixels: Array<number> = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    const a = bytes[i + 3];
    if (r !== undefined && g !== undefined && b !== undefined && a !== undefined && a >= 128) {
      pixels.push(argbFromRgb(r, g, b));
    }
  }
  if (pixels.length === 0) throw new Error("No visible pixels in image");

  // A bounded color histogram avoids Celebi's randomized clustering between builds.
  const colors = QuantizerMap.quantize(pixels);
  const dominant = [...colors].toSorted((a, b) => b[1] - a[1])[0]?.[0];
  if (dominant === undefined) throw new Error("No image colors extracted");
  // Grayscale images should remain neutral rather than using Score's Google Blue fallback.
  const seed = Score.score(colors, { desired: 1, fallbackColorARGB: dominant })[0];
  if (seed === undefined) throw new Error("No source color selected for image");
  return Hct.fromInt(seed);
}

export function readableImageColor(
  color: number,
  background: number,
  target: number,
  isDark: boolean,
) {
  const original = Hct.fromInt(color);
  const backgroundTone = Hct.fromInt(background).tone;
  for (let tone = original.tone; tone >= 0 && tone <= 100; tone += isDark ? 0.1 : -0.1) {
    const candidate = Hct.from(original.hue, original.chroma, tone).toInt();
    if (Contrast.ratioOfTones(Hct.fromInt(candidate).tone, backgroundTone) >= target) {
      return hexFromArgb(candidate);
    }
  }
  throw new Error(`Cannot meet ${target}:1 for image palette foreground`);
}

export function imageColorScheme(source: Hct, isDark: boolean, contrast: number) {
  return source.chroma < 5
    ? new SchemeMonochrome(source, isDark, contrast)
    : new SchemeTonalSpot(source, isDark, contrast);
}
