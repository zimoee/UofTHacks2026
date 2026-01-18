"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { MediaRecorderPanel } from "@/components/MediaRecorderPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  devLogin,
  getInterview,
  presignUpload,
  submitInterview,
  type Interview,
} from "@/lib/api";
import {
  uploadToLocalMultipartEndpoint,
  uploadToPresignedPutUrl,
} from "@/lib/upload";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const interviewId = params.id;

  const [interview, setInterview] = React.useState<Interview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [queued, setQueued] = React.useState(false);

  async function ensureAuth() {
    const token = window.localStorage.getItem("token");
    if (token) return;
    await devLogin("demo");
  }

  async function refresh() {
    await ensureAuth();
    const data = await getInterview(interviewId);
    setInterview(data);
  }

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        await refresh();
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load interview");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  React.useEffect(() => {
    if (!queued) return;
    if (!interview) return;
    if (interview.status === "complete" || interview.status === "failed")
      return;

    const t = window.setInterval(() => {
      refresh().catch(() => {});
    }, 1500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, interview?.status]);

  async function onUploadAndSubmit() {
    if (!blob) {
      setError("Record a video first.");
      return;
    }
    if (blob.size <= 0) {
      setError(
        "Recording is empty. Try recording again for at least a few seconds.",
      );
      return;
    }
    const duration = await getBlobDuration(blob);
    if (!duration || Number.isNaN(duration) || duration < 4) {
      setError("Recording must be at least 4 seconds. Try recording again.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await ensureAuth();
      const contentType = blob.type || "video/webm";
      const presigned = await presignUpload(interviewId, contentType);
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      if (presigned.mode === "local") {
        await uploadToLocalMultipartEndpoint(
          apiBase,
          presigned.upload_url,
          blob,
        );
        setQueued(true);
        await refresh();
      } else {
        await uploadToPresignedPutUrl(presigned.url, blob, presigned.headers);
        await submitInterview(interviewId, blob.size);
        setQueued(true);
        await refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function getBlobDuration(target: Blob): Promise<number | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(target);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      video.src = url;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Spinner /> Loading interview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/interview/new">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>
    );
  }

  if (!interview) return null;

  return (
    <div className="space-y-8">
      {/* <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
      </div> */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="type-title text-2xl sm:text-3xl">
            Mock interview session
          </h1>
          <p className="max-w-2xl font-typewriter text-sm text-warm-gray sm:text-base">
            Read the question(s), record your answer, and get feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>← Back</Button>
        </div>
      </div>
      <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
        <div className="rounded-3xl border border-light-gray bg-off-white/70 p-6 shadow-paper">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-typewriter text-lg font-bold text-ink">Question stack</h2>
            <span className="font-sans text-xs text-warm-gray">Pick 1-2 and go</span>
          </div>

          {interview.questions?.length ? (
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {interview.questions
                .slice()
                .sort((a, b) => a.order - b.order)
                .slice(0, 4)
                .map((q, i) => {
                  const tilt =
                    i % 4 === 0
                      ? "-rotate-1"
                      : i % 4 === 1
                        ? "rotate-1"
                        : i % 4 === 2
                          ? "-rotate-2"
                          : "rotate-2";
                  const bg =
                    i % 3 === 0
                      ? "bg-butter-yellow/80"
                      : i % 3 === 1
                        ? "bg-mint/55"
                        : "bg-lavender/55";
                  return (
                    <li
                      key={q.id}
                      className={[
                        "relative rounded-2xl border border-light-gray p-4 shadow-paper transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift",
                        bg,
                        tilt,
                      ].join(" ")}
                    >
                      <div className="pointer-events-none absolute right-4 top-4 h-3 w-12 rotate-6 rounded-sm bg-white/40" />
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-sans text-xs font-semibold text-ink">
                          Q{q.order + 1}
                        </p>
                        {q.competency ? (
                          <Badge variant="secondary">{q.competency}</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 font-typewriter text-sm text-ink/90">
                        {q.prompt}
                      </p>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <p className="mt-4 font-typewriter text-sm text-warm-gray">
              No questions yet.
            </p>
          )}
        </div>

        <MediaRecorderPanel
          onRecordingReady={setBlob}
          onSubmit={onUploadAndSubmit}
          submitDisabled={uploading || !blob}
          submitting={uploading}
          submitLabel="Submit"
        />
      </section>
      {interview.status === "complete" ? (
        <Card className="relative">
          <div
            className="pointer-events-none absolute -top-3 left-10 h-6 w-44 -rotate-2 rounded-sm bg-sage-green/55"
            aria-hidden="true"
          />
          <CardHeader>
            <CardTitle>Feedback page</CardTitle>
            <CardDescription>
              A gentle read-through, like notes from future-you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-light-gray bg-off-white p-4 shadow-sm">
              <p className="font-sans text-xs font-semibold text-ink">
                Interview storytelling identity
              </p>
              <p className="mt-2 font-typewriter text-sm text-ink/90">
                {interview.personality_fit?.archetype?.archetype ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-light-gray bg-off-white p-4 shadow-sm">
              <p className="font-sans text-xs font-semibold text-ink">
                Summary
              </p>
              <p className="mt-2 font-typewriter text-sm text-ink/90">
                {interview.ai_feedback?.summary ?? "—"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-light-gray bg-mint/35 p-4 shadow-sm">
                <p className="font-sans text-xs font-semibold text-ink">
                  Strengths
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-typewriter text-sm text-ink/90">
                  {(interview.ai_feedback?.strengths ?? []).map(
                    (s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ),
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-light-gray bg-dusty-pink/35 p-4 shadow-sm">
                <p className="font-sans text-xs font-semibold text-ink">
                  Next improvements
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-typewriter text-sm text-ink/90">
                  {(interview.ai_feedback?.weaknesses ?? []).map(
                    (s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ),
                  )}
                </ul>
              </div>
            </div>
            <details className="rounded-2xl border border-light-gray bg-off-white p-4 shadow-sm">
              <summary className="cursor-pointer font-sans text-xs font-semibold text-ink">
                Transcript
              </summary>
              <p className="mt-3 whitespace-pre-wrap font-typewriter text-sm text-ink/90">
                {interview.transcript_text || "—"}
              </p>
            </details>
          </CardContent>
        </Card>
      ) : null}
      {interview.status === "failed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Processing failed</CardTitle>
            <CardDescription>
              Check backend logs and your S3/AI env vars.
            </CardDescription>
          </CardHeader>
          <CardContent className="font-typewriter text-sm text-ink/90">
            <pre className="whitespace-pre-wrap rounded-2xl border border-light-gray bg-off-white p-4 text-xs">
              {JSON.stringify(interview.ai_feedback, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
