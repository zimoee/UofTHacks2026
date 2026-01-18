"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  onRecordingReady: (blob: Blob) => void;
  maxDurationMs?: number;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitting?: boolean;
};

function formatMs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const mt of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mt)) return mt;
    } catch {
      // ignore
    }
  }
  return "";
}

export function MediaRecorderPanel({
  onRecordingReady,
  maxDurationMs = 60_000,
  onSubmit,
  submitLabel = "Submit recording",
  submitDisabled = false,
  submitting = false,
}: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const stopTimerRef = React.useRef<number | null>(null);
  const tickTimerRef = React.useRef<number | null>(null);
  const startAtRef = React.useRef<number | null>(null);

  const [supported, setSupported] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [mimeType, setMimeType] = React.useState<string>("");
  const [remainingMs, setRemainingMs] = React.useState<number>(maxDurationMs);

  React.useEffect(() => {
    const ok = typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
    setSupported(ok);
    if (ok) setMimeType(pickMimeType());
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initStream() {
    setPermissionError(null);
    setInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setPermissionError(e?.message ?? "Could not access camera/microphone.");
    } finally {
      setInitializing(false);
    }
  }

  function start() {
    if (!mediaStreamRef.current) return;
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    chunksRef.current = [];
    const options: MediaRecorderOptions = {};
    if (mimeType) options.mimeType = mimeType;
    // keep file sizes reasonable for 60s clips
    options.videoBitsPerSecond = 1_500_000;
    const recorder = new MediaRecorder(mediaStreamRef.current, options);
    recorderRef.current = recorder;
    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      onRecordingReady(blob);
    };
    recorder.start(250); // chunk every 250ms
    startAtRef.current = Date.now();
    setRemainingMs(maxDurationMs);
    setRecording(true);

    stopTimerRef.current = window.setTimeout(() => stop(), maxDurationMs);
    tickTimerRef.current = window.setInterval(() => {
      if (!startAtRef.current) return;
      const elapsed = Date.now() - startAtRef.current;
      setRemainingMs(Math.max(0, maxDurationMs - elapsed));
    }, 200);
  }

  function stop() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
    recorderRef.current?.stop();
    setRecording(false);
    startAtRef.current = null;
  }

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recording not supported</CardTitle>
          <CardDescription>Your browser doesn’t support the MediaRecorder API.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="relative rotate-1">
      <div
        className="pointer-events-none absolute -top-3 right-10 h-6 w-36 rotate-2 rounded-sm bg-lavender/60"
        aria-hidden="true"
      />
      <CardHeader>
        <CardTitle>Record your answers</CardTitle>
        <CardDescription>
          Record up to {Math.round(maxDurationMs / 1000)} seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mediaStreamRef.current ? (
          <Button onClick={initStream} disabled={initializing} className="w-full sm:w-auto">
            {initializing ? (
              <>
                <Spinner className="h-4 w-4" /> Enabling camera…
              </>
            ) : (
              "Enable camera + mic"
            )}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!recording ? (
              <Button
                onClick={start}
                className="h-12 rounded-full px-6 shadow-sm hover:shadow-paper"
                title="Start recording"
              >
                ● Record 60s
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive" className="h-12 rounded-full px-6">
                ■ Stop ({formatMs(remainingMs)})
              </Button>
            )}
          </div>
        )}

        {permissionError ? <p className="text-sm text-red-600">{permissionError}</p> : null}
        {mediaStreamRef.current ? null : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="font-sans text-xs font-semibold text-warm-gray">Live</p>
            <video
              ref={videoRef}
              playsInline
              className="aspect-video w-full rounded-2xl border border-light-gray bg-black/5 object-cover shadow-polaroid"
            />
          </div>
          <div className="space-y-2">
            <p className="font-sans text-xs font-semibold text-warm-gray">Preview</p>
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="aspect-video w-full rounded-2xl border border-light-gray bg-black/5 object-cover shadow-polaroid"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-light-gray bg-off-white text-sm text-warm-gray shadow-sm">
                No recording yet
              </div>
            )}
          </div>
        </div>

        {onSubmit ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onSubmit} disabled={submitDisabled}>
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" /> Uploading…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
