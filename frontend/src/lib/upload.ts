export async function uploadToPresignedPutUrl(
  url: string,
  blob: Blob,
  headers: Record<string, string>
) {
  const res = await fetch(url, { method: "PUT", body: blob, headers });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

export async function uploadToLocalMultipartEndpoint(apiBaseUrl: string, uploadPath: string, blob: Blob) {
  const token = window.localStorage.getItem("token");
  const form = new FormData();
  form.append("file", blob, "interview.webm");

  const headers = new Headers();
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${apiBaseUrl}${uploadPath}`, {
    method: "POST",
    body: form,
    headers,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.detail || `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

