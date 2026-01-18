export type AuthState = {
  token: string;
  user: { id: number | string; username: string; email: string };
};

export type Interview = {
  id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  job?: {
    id: string;
    url: string;
    title: string;
    company: string;
    location?: string;
    description?: string;
    created_at?: string;
  } | null;
  video_object_key: string;
  transcript_text: string;
  ai_feedback: any;
  personality_fit: any;
  questions: Array<{
    id: string;
    prompt: string;
    competency: string;
    order: number;
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body)
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.detail || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function devLogin(username = "demo") {
  const data = await apiFetch<AuthState>("/api/auth/dev-login/", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  window.localStorage.setItem("token", data.token);
  window.localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function createInterview(payload: {
  job_url?: string;
  title?: string;
  company?: string;
}) {
  return apiFetch<Interview>("/api/interviews/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInterview(id: string) {
  return apiFetch<Interview>(`/api/interviews/${id}/`);
}

export async function listInterviews() {
  return apiFetch<Interview[]>("/api/interviews/");
}

export async function presignUpload(interviewId: string, contentType: string) {
  return apiFetch<
    | {
        mode: "s3";
        object_key: string;
        url: string;
        headers: Record<string, string>;
      }
    | { mode: "local"; upload_url: string }
  >(`/api/interviews/${interviewId}/presign_upload/`, {
    method: "POST",
    body: JSON.stringify({ content_type: contentType }),
  });
}

export async function submitInterview(
  interviewId: string,
  videoSizeBytes: number,
) {
  return apiFetch<{ queued: boolean; interview_id: string }>(
    `/api/interviews/${interviewId}/submit/`,
    {
      method: "POST",
      body: JSON.stringify({ video_size_bytes: videoSizeBytes }),
    },
  );
}

export async function getInterviewStatistics() {
  return apiFetch<{
    total_interviews: number;
    average_duration_seconds: number;
    most_practiced_competency: string | null;
    total_questions_answered: number;
  }>("/api/interviews/statistics/");
}
