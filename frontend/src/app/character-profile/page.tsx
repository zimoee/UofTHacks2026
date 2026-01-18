"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BUNNY_DRAWING_SRC = "/characters/bunny.png"; // drop your drawing here
const BUNNY_FALLBACK_SRC = "/characters/bunny-pixel.svg";

function Bar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-typewriter text-sm font-bold text-ink">{label}</p>
        <p className="font-sans text-xs font-semibold text-warm-gray">{clamped}%</p>
      </div>
      <div
        className="h-3 w-full rounded-full border border-light-gray bg-off-white/80 shadow-sm"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div
          className="h-full rounded-full bg-soft-blue shadow-sm"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function CharacterProfilePage() {
  // Temporary stub values; later can be driven by onboarding/personality model.
  const metrics = React.useMemo(
    () => [
      { label: "Confidence", value: 64 },
      { label: "Clarity", value: 71 },
      { label: "Structure", value: 58 },
    ],
    []
  );

  const [bunnySrc, setBunnySrc] = React.useState(BUNNY_DRAWING_SRC);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="script-title text-4xl sm:text-5xl">Character profile</h1>
          <p className="max-w-2xl font-typewriter text-sm text-warm-gray sm:text-base">
            A friendly snapshot of how you’re showing up right now—so your next session has a clear
            focus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sessions">
            <Button variant="secondary">Sessions</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>

      {/* Main panel: same layout language as /sessions, but blue */}
      <div className="relative overflow-hidden rounded-3xl border border-light-gray bg-soft-blue/18 p-6 shadow-paper sm:p-8">
        <div className="pointer-events-none absolute left-10 top-6 h-5 w-24 -rotate-2 rounded-sm bg-soft-blue/45" />
        <div className="pointer-events-none absolute right-10 top-10 h-5 w-28 rotate-2 rounded-sm bg-mint/35" />

        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
          {/* Bunny "polaroid" */}
          <div className="relative mx-auto w-full max-w-sm rotate-1 rounded-3xl border border-light-gray bg-white p-5 shadow-polaroid">
            <div className="pointer-events-none absolute left-8 top-4 h-4 w-24 -rotate-2 rounded-sm bg-soft-blue/35" />
            <p className="font-sans text-[11px] font-semibold text-warm-gray">The Professional (temp)</p>
            <div className="mt-4 grid place-items-center rounded-2xl border border-light-gray bg-off-white p-6">
              <img
                src={bunnySrc}
                alt="Bunny character"
                className={[
                  "h-[220px] w-[220px] object-contain sm:h-[240px] sm:w-[240px]",
                  bunnySrc === BUNNY_FALLBACK_SRC ? "image-rendering-pixelated" : "",
                ].join(" ")}
                onError={() => setBunnySrc(BUNNY_FALLBACK_SRC)}
              />
            </div>
            <p className="mt-4 font-typewriter text-sm text-ink/80">
              Calm energy, tidy stories, and a gentle push toward stronger results.
            </p>
          </div>

          {/* Metrics */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-light-gray bg-off-white/65 p-6 shadow-paper">
              <p className="font-typewriter text-lg font-bold text-ink">Today’s focus</p>
              <p className="mt-1 font-typewriter text-sm text-warm-gray">
                Pick one bar to improve by 10% in your next recording.
              </p>

              <div className="mt-5 space-y-4">
                {metrics.map((m) => (
                  <Bar key={m.label} label={m.label} value={m.value} />
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/interview/new">
                  <Button>Practice again</Button>
                </Link>
                <Link href="/sessions">
                  <Button variant="secondary">Review sessions</Button>
                </Link>
              </div>
            </div>

            <Card className="-rotate-1">
              <CardHeader>
                <CardTitle>Micro-coaching (temp)</CardTitle>
                <CardDescription>Small changes with big payoff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-typewriter text-sm text-ink/80">
                <p>• Confidence: end with one crisp outcome sentence.</p>
                <p>• Clarity: say your point first, then tell the story.</p>
                <p>• Structure: label STAR out loud (Situation, Task, Action, Result).</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

