import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <Badge variant="secondary">Boilerplate</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Behavioral Interview Feedback
          </h1>
          <p className="max-w-2xl text-slate-600">
            Paste a job link → get curated behavioral questions → record answers on the spot → upload via
            presigned URL → background transcription & AI feedback.
          </p>
        </div>
        <div className="hidden sm:block">
          <Link href="/interview/new">
            <Button>Start a mock interview</Button>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>1) Curate questions</CardTitle>
            <CardDescription>Generate role-aware behavioral prompts.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Wired for OpenAI question generation (stubbed in boilerplate).
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2) Record on the spot</CardTitle>
            <CardDescription>Browser-native video capture.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Uses the MediaRecorder API with a simple preview + re-record loop.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>3) Feedback & fit</CardTitle>
            <CardDescription>Strengths, weaknesses, STAR coaching.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Celery task simulates TwelveLabs transcription + GPT feedback (replace stubs when ready).
          </CardContent>
        </Card>
      </section>

      <div className="sm:hidden">
        <Link href="/interview/new">
          <Button className="w-full">Start a mock interview</Button>
        </Link>
      </div>
    </main>
  );
}

