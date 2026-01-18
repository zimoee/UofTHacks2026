"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Home header mascots.
 *
 * To replace with your own PNGs, drop these files into `frontend/public/characters/`:
 * - bunny.png
 * - turtle.png
 * - cat.png
 *
 * They will automatically be used (fallbacks to the pixel SVGs below if missing).
 */
const MASCOTS = [
  {
    src: "/characters/bunny.png",
    fallbackSrc: "/characters/bunny-pixel.svg",
    alt: "Bunny mascot",
  },
  {
    src: "/characters/turtle.png",
    fallbackSrc: "/characters/turtle-pixel.svg",
    alt: "Turtle mascot",
  },
  {
    src: "/characters/cat.png",
    fallbackSrc: "/characters/cat-pixel.svg",
    alt: "Cat mascot",
  },
] as const;

export function HomeMascots() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <span className="hidden items-center -space-x-3 sm:inline-flex" aria-label="Mascots">
      {MASCOTS.map((m, i) => (
        <span
          key={m.src}
          className={[
            "grid h-20 w-20 place-items-center overflow-hidden",
            i === 0 ? "-rotate-2" : i === 1 ? "rotate-2" : "-rotate-1",
          ].join(" ")}
          aria-hidden="true"
        >
          <img
            src={m.src}
            alt=""
            className="h-full w-full object-contain drop-shadow-sm"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallbackApplied === "1") return;
              el.dataset.fallbackApplied = "1";
              el.src = m.fallbackSrc;
              el.classList.add("image-rendering-pixelated");
            }}
          />
        </span>
      ))}
    </span>
  );
}

