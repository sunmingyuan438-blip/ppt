import JSZip from "jszip";
import type { BrandKit } from "./material-types.js";

const defaultBrand: BrandKit = { colors: ["#172238", "#B47B49", "#F4EFE7", "#E2D8C8"], headingFont: "Aptos Display", bodyFont: "Aptos", slideWidth: 13.333, slideHeight: 7.5, warnings: [] };

export async function extractBrandKit(body: Uint8Array, fallback: Partial<BrandKit> = {}): Promise<BrandKit> {
  const result: BrandKit = { ...defaultBrand, ...fallback, colors: fallback.colors?.length ? fallback.colors : [...defaultBrand.colors], warnings: [] };
  try {
    const zip = await JSZip.loadAsync(body);
    const theme = zip.files["ppt/theme/theme1.xml"];
    if (theme) {
      const xml = await theme.async("text");
      const colors = [...xml.matchAll(/<a:srgbClr val="([0-9A-Fa-f]{6})"/g)].map((match) => `#${match[1].toUpperCase()}`);
      const fonts = [...xml.matchAll(/<a:latin typeface="([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
      if (colors.length) result.colors = [...new Set(colors)].slice(0, 8);
      if (fonts[0]) result.headingFont = fonts[0];
      if (fonts[1]) result.bodyFont = fonts[1];
    } else result.warnings.push("theme_not_found");
  } catch {
    result.warnings.push("pptx_theme_parse_failed");
  }
  return result;
}
