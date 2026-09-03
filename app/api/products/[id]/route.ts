import { supabaseRest } from "@/lib/supabase-rest";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!/^[0-9a-fA-F-]{30,40}$/.test(id)) {
    return Response.json({ error: "Invalid product ID." }, { status: 400 });
  }

  try {
    await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not delete product." },
      { status: 500 }
    );
  }
}
