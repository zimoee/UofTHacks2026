"use client";

import * as React from "react";

import { STICKERS } from "@/lib/stickers";
import { Sticker } from "@/components/decorative/Sticker";

/**
 * Decorative sticker layer. Central place to reposition / swap assets.
 * Safe to remove later (purely visual).
 */
export function StickerLayer() {
  const starVariants = React.useMemo(
    () => [STICKERS.star1, STICKERS.star2, STICKERS.star3, STICKERS.star4],
    []
  );

  const starPlacements = React.useMemo(
    () => [
      // Top area
      { className: "-right-8 top-12 h-32 w-32 opacity-95", rotate: 12 },
      { className: "-left-10 top-10 h-28 w-28 opacity-70", rotate: -14 },
      { className: "left-[52%] top-6 hidden h-20 w-20 opacity-55 lg:block", rotate: 7 },

      // Mid area
      { className: "left-10 top-[22%] h-24 w-24 opacity-80 md:left-16 md:top-[26%]", rotate: -6 },
      { className: "right-20 top-[44%] h-20 w-20 opacity-70 md:h-24 md:w-24", rotate: 8 },
      { className: "left-4 top-[62%] hidden h-20 w-20 opacity-50 md:block", rotate: -9 },
      { className: "right-6 top-[22%] hidden h-16 w-16 opacity-55 md:block", rotate: 16 },

      // Bottom area
      { className: "bottom-10 left-10 h-28 w-28 opacity-85 md:bottom-16", rotate: 9 },
      { className: "bottom-6 right-10 h-24 w-24 opacity-70 md:bottom-10", rotate: -11 },
      { className: "bottom-24 right-[42%] hidden h-16 w-16 opacity-45 lg:block", rotate: 4 },
      { className: "bottom-[42%] -right-10 hidden h-28 w-28 opacity-35 xl:block", rotate: 18 },
    ],
    []
  );

  const fallbackChosen = React.useMemo(
    () => starPlacements.map((_, i) => starVariants[i % starVariants.length]),
    [starPlacements, starVariants]
  );
  const [chosen, setChosen] = React.useState(fallbackChosen);

  React.useEffect(() => {
    // Randomize on the client only to avoid hydration mismatches.
    const randInt = (maxExclusive: number) => {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] % maxExclusive;
      }
      return Math.floor(Math.random() * maxExclusive);
    };

    let prev = -1;
    const randomized = starPlacements.map(() => {
      let idx = randInt(starVariants.length);
      if (starVariants.length > 1) {
        while (idx === prev) idx = randInt(starVariants.length);
      }
      prev = idx;
      return starVariants[idx];
    });
    setChosen(randomized);
  }, [starPlacements, starVariants]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Top corners */}
      <Sticker sticker={STICKERS.tapeBlue} className="-left-12 top-2 h-20 w-56 opacity-90" rotate={-8} />
      {starPlacements.map((p, i) => (
        <Sticker key={i} sticker={chosen[i]} className={p.className} rotate={p.rotate} />
      ))}
      <Sticker sticker={STICKERS.tapeBlue} className="-right-24 bottom-8 h-20 w-56 opacity-80" rotate={9} />
    </div>
  );
}
