import { getSupabaseEnv } from "@/lib/env";

export async function GET() {
  const env = getSupabaseEnv();
  if (!env.configured) {
    return Response.json(
      {
        ok: false,
        configured: false,
        message: "Cloudflare is running, but the Supabase variables are not set yet.",
      },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(`${env.url}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: env.key!,
        Authorization: `Bearer ${env.key!}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({
        ok: false,
        configured: true,
        message: `Supabase responded with ${response.status}. Run setup.sql if you have not created the tables yet.`,
        detail: error.slice(0, 300),
      });
    }

    return Response.json({
      ok: true,
      configured: true,
      message: "Connected to Supabase.",
    });
  } catch (error) {
    return Response.json({
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : "Connection failed.",
    });
  }
}
