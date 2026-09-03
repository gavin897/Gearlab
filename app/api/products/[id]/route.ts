import { supabaseRest } from "@/lib/supabase-rest";

function validId(id: string) {
  return /^[0-9a-fA-F-]{30,40}$/.test(id);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!validId(id)) {
    return Response.json({ error: "Invalid product ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const modelUrl =
      typeof body?.model_url === "string" ? body.model_url.trim() : "";

    if (!modelUrl) {
      return Response.json(
        { error: "A model_url is required." },
        { status: 400 }
      );
    }

    const response = await supabaseRest(
      `/rest/v1/products?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          model_url: modelUrl,
        }),
      }
    );

    const updated = await response.json();

    return Response.json({
      ok: true,
      product: Array.isArray(updated) ? updated[0] : updated,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update product model.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!validId(id)) {
    return Response.json({ error: "Invalid product ID." }, { status: 400 });
  }

  try {
    await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete product.",
      },
      { status: 500 }
    );
  }
}
