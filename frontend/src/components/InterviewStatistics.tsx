"use client";

import { getInterviewStatistics } from "@/lib/api";
import * as React from "react";
import { Spinner } from "@/components/ui/spinner";

export function InterviewStatistics() {
  const [stats, setStats] = React.useState<{
    total_interviews: number;
    average_duration_seconds: number;
    most_practiced_competency: string | null;
    total_questions_answered: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadStats() {
      try {
        setError(null);
        const data = await getInterviewStatistics();
        setStats(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-typewriter text-sm text-warm-gray">
        <Spinner /> Loading statistics…
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-light-gray bg-butter-yellow/30 p-4 sm:p-6">
        <p className="font-sans text-xs font-semibold uppercase text-warm-gray">Total Interviews</p>
        <p className="mt-2 font-typewriter text-2xl font-bold text-ink">{stats.total_interviews}</p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-soft-blue/30 p-4 sm:p-6">
        <p className="font-sans text-xs font-semibold uppercase text-warm-gray">Avg Duration</p>
        <p className="mt-2 font-typewriter text-2xl font-bold text-ink">{formatDuration(stats.average_duration_seconds)}</p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-mint/30 p-4 sm:p-6">
        <p className="font-sans text-xs font-semibold uppercase text-warm-gray">Total Questions</p>
        <p className="mt-2 font-typewriter text-2xl font-bold text-ink">{stats.total_questions_answered}</p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-lavender/30 p-4 sm:p-6">
        <p className="font-sans text-xs font-semibold uppercase text-warm-gray">Most Practiced</p>
        <p className="mt-2 font-typewriter text-2xl font-bold text-ink">
          {stats.most_practiced_competency || "—"}
        </p>
      </div>
    </div>
  );
}
