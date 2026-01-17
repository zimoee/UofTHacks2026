"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  onRecordingReady: (blob: Blob) => void;
};

export function MediaRecorderPanel({ onRecordingReady }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const [supported, setSupported] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ok = typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
    setSupported(ok);
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
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
    chunksRef.current = [];
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: "video/webm" });
    recorderRef.current = recorder;
    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      onRecordingReady(blob);
    };
    recorder.start();
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
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
    <Card>
      <CardHeader>
        <CardTitle>Record your answers</CardTitle>
        <CardDescription>Hit record, answer the prompts, then upload when you’re done.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mediaStreamRef.current ? (
          <Button onClick={initStream} disabled={initializing}>
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
              <Button onClick={start}>Start recording</Button>
            ) : (
              <Button onClick={stop} variant="destructive">
                Stop
              </Button>
            )}
          </div>
        )}

        {permissionError ? <p className="text-sm text-red-600">{permissionError}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Live</p>
            <video
              ref={videoRef}
              playsInline
              className="aspect-video w-full rounded-lg border bg-slate-50 object-cover"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview</p>
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="aspect-video w-full rounded-lg border bg-slate-50 object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-slate-50 text-sm text-slate-500">
                No recording yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

