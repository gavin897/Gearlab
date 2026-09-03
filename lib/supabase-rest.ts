import { getSupabaseEnv } from "./env";

function headers(extra: HeadersInit = {}) {
  const { key, configured } = getSupabaseEnv();
  if (!configured || !key) {
    throw new Error("Supabase environment variables are missing.");
  }
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

export async function supabaseRest(path: string, init: RequestInit = {}) {
  const { url, configured } = getSupabaseEnv();
  if (!configured || !url) {
    throw new Error("Supabase environment variables are missing.");
  }

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: headers(init.headers),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${body || response.statusText}`);
  }
  return response;
}

export async function uploadToSupabaseStorage(
  filename: string,
  contentType: string,
  bytes: ArrayBuffer
) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const path = `/storage/v1/object/gearlab-assets/${unique}`;

  await supabaseRest(path, {
    method: "POST",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "false",
    },
    body: bytes,
  });

  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/gearlab-assets/${unique}`;
}
