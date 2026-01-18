"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { createInterview, devLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function NewInterviewPage() {
  const router = useRouter();
  const [jobUrl, setJobUrl] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function ensureAuth() {
    const token = window.localStorage.getItem("token");
    if (token) return;
    await devLogin("demo");
  }

  async function onCreate() {
    setError(null);
    setLoading(true);
    try {
      await ensureAuth();
      const interview = await createInterview({
        job_url: jobUrl || undefined,
        company: company || undefined,
        title: title || undefined,
      });
      router.push(`/interview/${interview.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create interview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="type-title text-2xl sm:text-3xl">
            Start a new practice session
          </h1>
          <p className="max-w-2xl font-typewriter text-sm text-warm-gray sm:text-base">
            Add a job link, company, and/or role to generate tailored interview
            questions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,0.85fr] lg:items-start">
        <Card className="relative">
          <div
            className="pointer-events-none absolute -top-3 left-10 h-6 w-36 -rotate-2 rounded-sm bg-soft-blue/60"
            aria-hidden="true"
          />
          <CardHeader>
            <CardTitle>Job context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobUrl">Job link</Label>
              <Input
                id="jobUrl"
                placeholder="https://linkedin.com/jobs/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. TwelveLabs"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Role</Label>
                <Input
                  id="title"
                  placeholder="e.g. Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <p className="font-typewriter text-sm text-red-700">{error}</p>
            ) : null}

            <Button
              onClick={onCreate}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" /> Creating…
                </>
              ) : (
                "Generate questions"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="relative rounded-2xl border border-light-gray bg-butter-yellow/70 p-6 shadow-paper transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift">
          <div
            className="pointer-events-none absolute right-6 top-5 h-4 w-20 rotate-3 rounded-sm bg-dusty-pink/60"
            aria-hidden="true"
          />
          <h2 className="font-typewriter text-lg font-bold text-ink">
            Tiny prep checklist
          </h2>
          <ul className="mt-3 space-y-2 font-typewriter text-sm text-ink/80">
            <li>• Speak out loud (it feels different than reading)</li>
            <li>
              • Aim for one clear story (STAR): Situation → Task → Action →
              Result
            </li>
            <li>• Include 1 metric (even if it’s rough)</li>
            <li>• End with a reflection: what you’d do differently next time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
