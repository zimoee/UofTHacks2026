"use client";

import * as React from "react";

import type { StickerDef } from "@/lib/stickers";
import { cn } from "@/lib/utils";

export type StickerProps = {
  sticker: StickerDef;
  className?: string;
  /**
   * Set to true if the sticker is purely decorative.
   * If false, alt text will be announced by screen readers.
   */
  decorative?: boolean;
  /** Rotation for the image itself (degrees). */
  rotate?: number;
};

export function Sticker({ sticker, className, decorative = true, rotate = 0 }: StickerProps) {
  const [src, setSrc] = React.useState(sticker.src);
  const triedFallbackRef = React.useRef(false);

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      className={cn("pointer-events-none absolute select-none", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <img
        src={src}
        alt={decorative ? "" : sticker.alt}
        className="h-full w-full object-contain"
        onError={() => {
          if (triedFallbackRef.current) return;
          triedFallbackRef.current = true;
          if (sticker.fallbackSrc) setSrc(sticker.fallbackSrc);
        }}
      />
    </span>
  );
}

