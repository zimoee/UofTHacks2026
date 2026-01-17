"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { createInterview, devLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Start a mock interview</h1>
          <p className="text-sm text-slate-600">
            Paste a job link and we’ll generate a short set of behavioral questions.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job context</CardTitle>
          <CardDescription>Optional, but improves question quality.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job link</Label>
            <Input
              id="jobUrl"
              placeholder="https://... (Greenhouse, Lever, LinkedIn, etc.)"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Role</Label>
              <Input
                id="title"
                placeholder="e.g. Software Engineer Intern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onCreate} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> Creating…
              </>
            ) : (
              "Generate questions"
            )}
          </Button>
          <p className="text-xs text-slate-500">
            Dev mode uses <span className="font-medium">/api/auth/dev-login</span> for a demo token.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

