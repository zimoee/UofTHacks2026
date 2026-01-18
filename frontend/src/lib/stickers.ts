export type StickerDef = {
  /** Swap this to a PNG path in `/public/stickers/...` */
  src: string;
  /** Optional fallback if the primary `src` is missing. */
  fallbackSrc?: string;
  alt: string;
};

/**
 * Central sticker registry.
 *
 * Replace the `.svg` files in `public/stickers/` with `.png` (same names),
 * or update `src` here to point to your imported assets.
 */
export const STICKERS = {
  // Star variants (drop these PNGs into `public/stickers/`):
  // - star-1.png
  // - star-2.png
  // - star-3.png
  // - star-4.png
  star1: { src: "/stickers/star-1.png", fallbackSrc: "/stickers/star.svg", alt: "Star sticker" },
  star2: { src: "/stickers/star-2.png", fallbackSrc: "/stickers/star.svg", alt: "Star sticker" },
  star3: { src: "/stickers/star-3.png", fallbackSrc: "/stickers/star.svg", alt: "Star sticker" },
  star4: { src: "/stickers/star-4.png", fallbackSrc: "/stickers/star.svg", alt: "Star sticker" },

  tapeBlue: { src: "/stickers/tape-blue.svg", alt: "Blue washi tape sticker" },
} as const satisfies Record<string, StickerDef>;

