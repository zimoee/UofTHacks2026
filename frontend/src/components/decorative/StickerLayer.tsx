import * as React from "react";

import { STICKERS } from "@/lib/stickers";
import { Sticker } from "@/components/decorative/Sticker";

/**
 * Decorative sticker layer. Central place to reposition / swap assets.
 * Safe to remove later (purely visual).
 */
export function StickerLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Top corners */}
      <Sticker sticker={STICKERS.tapeBlue} className="-left-12 top-2 h-20 w-56 opacity-90" rotate={-8} />
      <Sticker sticker={STICKERS.star1} className="-right-8 top-12 h-32 w-32 opacity-95" rotate={12} />

      {/* Mid accents */}
      <Sticker sticker={STICKERS.heart} className="left-6 top-[48%] h-14 w-14 opacity-85 md:h-16 md:w-16" rotate={-10} />
      <Sticker sticker={STICKERS.star2} className="left-10 top-[22%] h-24 w-24 opacity-80 md:left-16 md:top-[26%]" rotate={-6} />
      <Sticker sticker={STICKERS.star3} className="right-20 top-[44%] h-20 w-20 opacity-70 md:h-24 md:w-24" rotate={8} />

      {/* Bottom edges */}
      <Sticker sticker={STICKERS.star4} className="bottom-10 left-10 h-28 w-28 opacity-85 md:bottom-16" rotate={9} />
      <Sticker sticker={STICKERS.tapeBlue} className="-right-24 bottom-8 h-20 w-56 opacity-80" rotate={9} />
    </div>
  );
}

