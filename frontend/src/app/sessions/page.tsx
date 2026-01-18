"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { devLogin, listInterviews, type Interview } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function sessionTitle(s: Interview) {
  const title = s.job?.title?.trim();
  const company = s.job?.company?.trim();
  if (title && company) return `${title} @ ${company}`;
  if (title) return title;
  if (company) return company;
  return "Practice session";
}

export default function SessionsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Interview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function ensureAuth() {
    const token = window.localStorage.getItem("token");
    if (token) return;
    await devLogin("demo");
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      await ensureAuth();
      const data = await listInterviews();
      const sorted = data
        .slice()
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      setItems(sorted);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="script-title text-4xl sm:text-5xl">
            Review previous sessions
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
          <Link href="/interview/new">
            <Button>New session</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-light-gray bg-off-white/60 p-6 shadow-paper sm:p-8">
        <div className="pointer-events-none absolute left-2 top-1 h-5 w-24 -rotate-12 rounded-sm bg-butter-yellow/80" />
        <div className="pointer-events-none absolute right-10 top-10 h-5 w-28 rotate-6 rounded-sm bg-mint/55" />

        {loading ? (
          <div className="flex items-center gap-2 font-typewriter text-sm text-warm-gray">
            <Spinner /> Loading sessions…
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="font-typewriter text-sm text-red-700">{error}</p>
            <Button variant="secondary" onClick={load}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="space-y-3">
            <p className="font-typewriter text-sm text-warm-gray">
              No sessions yet. Start one and it’ll show up here.
            </p>
            {/* <Link href="/interview/new">
              <Button>Start a session</Button>
            </Link> */}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 24).map((s, i) => {
              const tilt =
                i % 3 === 0
                  ? "-rotate-1"
                  : i % 3 === 1
                    ? "rotate-1"
                    : "-rotate-2";
              const accent =
                i % 4 === 0
                  ? "bg-butter-yellow/75"
                  : i % 4 === 1
                    ? "bg-soft-blue/30"
                    : i % 4 === 2
                      ? "bg-dusty-pink/35"
                      : "bg-mint/35";
              return (
                <Link
                  key={s.id}
                  href={`/interview/${s.id}`}
                  className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
                  aria-label={`Open session: ${sessionTitle(s)}`}
                >
                  <div
                    className={[
                      "relative rounded-2xl border border-light-gray p-5 shadow-paper transition duration-300 ease-out",
                      "hover:-translate-y-1 hover:shadow-lift",
                      accent,
                      tilt,
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute right-4 top-4 h-3 w-12 rotate-6 rounded-sm bg-white/40" />
                    <p className="font-sans text-[11px] font-semibold text-warm-gray">
                      {formatDate(s.created_at)} •{" "}
                      {String(s.status || "").toUpperCase()}
                    </p>
                    <p className="mt-2 font-typewriter text-base font-bold text-ink">
                      {sessionTitle(s)}
                    </p>
                    <p className="mt-2 line-clamp-2 font-typewriter text-sm text-ink/80">
                      {s.questions?.length
                        ? `${s.questions.length} questions`
                        : "No questions saved"}
                    </p>
                    <p className="mt-3 font-sans text-xs font-medium text-ink underline decoration-ink/20 underline-offset-4 opacity-80 transition group-hover:opacity-100">
                      Open →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Card className="rotate-1">
        <CardHeader>
          <CardTitle>Quick note</CardTitle>
          <CardDescription>
            Make the next session a little bit (10%) better.
          </CardDescription>
        </CardHeader>
        <CardContent className="font-typewriter text-sm text-warm-gray">
          Rewatch one session and write down: one strong sentence you’ll reuse,
          and one sentence you’ll rewrite!
        </CardContent>
      </Card>
    </div>
  );
}
