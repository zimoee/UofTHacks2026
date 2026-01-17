"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { MediaRecorderPanel } from "@/components/MediaRecorderPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { devLogin, getInterview, presignUpload, submitInterview, type Interview } from "@/lib/api";
import { uploadToLocalMultipartEndpoint, uploadToPresignedPutUrl } from "@/lib/upload";

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
    if (interview.status === "complete" || interview.status === "failed") return;

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
    setError(null);
    setUploading(true);
    try {
      await ensureAuth();
      const contentType = blob.type || "video/webm";
      const presigned = await presignUpload(interviewId, contentType);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      if (presigned.mode === "local") {
        await uploadToLocalMultipartEndpoint(apiBase, presigned.upload_url, blob);
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
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Mock interview</h1>
            <Badge variant="secondary">{interview.status}</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Answer the questions out loud while recording. When you stop, upload to get feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/interview/new">
            <Button variant="secondary">New</Button>
          </Link>
          <Button variant="ghost" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Curated behavioral prompts for this job context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {interview.questions?.length ? (
            <ol className="space-y-3">
              {interview.questions
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((q) => (
                  <li key={q.id} className="rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Q{q.order + 1}</p>
                      {q.competency ? <Badge variant="secondary">{q.competency}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{q.prompt}</p>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">No questions yet.</p>
          )}
        </CardContent>
      </Card>

      <MediaRecorderPanel onRecordingReady={setBlob} />

      <Card>
        <CardHeader>
          <CardTitle>Upload & feedback</CardTitle>
          <CardDescription>
            Videos upload directly to S3-compatible storage via presigned URL. Processing happens in Celery.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {queued && interview.status !== "complete" && interview.status !== "failed" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Processing… (auto-refreshing)
              </span>
            ) : (
              <span>Ready when you are.</span>
            )}
          </div>
          <Button onClick={onUploadAndSubmit} disabled={uploading || !blob}>
            {uploading ? (
              <>
                <Spinner className="h-4 w-4" /> Uploading…
              </>
            ) : (
              "Upload & get feedback"
            )}
          </Button>
        </CardContent>
      </Card>

      {interview.status === "complete" ? (
        <Card>
          <CardHeader>
            <CardTitle>AI feedback</CardTitle>
            <CardDescription>Stub output today; replace with OpenAI STAR analysis and per-answer scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm font-medium">Summary</p>
              <p className="mt-1 text-sm text-slate-700">{interview.ai_feedback?.summary ?? "—"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-sm font-medium">Strengths</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(interview.ai_feedback?.strengths ?? []).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-sm font-medium">Weaknesses</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(interview.ai_feedback?.weaknesses ?? []).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm font-medium">Transcript (stub)</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {interview.transcript_text || "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {interview.status === "failed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Processing failed</CardTitle>
            <CardDescription>Check backend logs and your S3/AI env vars.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <pre className="whitespace-pre-wrap rounded-lg border bg-slate-50 p-3 text-xs">
              {JSON.stringify(interview.ai_feedback, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

