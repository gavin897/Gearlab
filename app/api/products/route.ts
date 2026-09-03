import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const response = await supabaseRest(
      "/rest/v1/products?select=*&order=created_at.desc&limit=100"
    );
    const products = await response.json();
    return Response.json({ products });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let product: any;
  try {
    product = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!product?.name || !product?.source_url) {
    return Response.json({ error: "Product name and source URL are required." }, { status: 400 });
  }

  const row = {
    name: String(product.name).slice(0, 240),
    brand: product.brand ? String(product.brand).slice(0, 120) : null,
    description: product.description ? String(product.description).slice(0, 1200) : null,
    image_url: product.image_url ? String(product.image_url) : null,
    source_url: String(product.source_url),
    price: product.price ? String(product.price).slice(0, 80) : null,
    rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : null,
    model_url: product.model_url ? String(product.model_url) : null,
  };

  try {
    const response = await supabaseRest("/rest/v1/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });
    const data = await response.json();
    return Response.json({ product: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save product." },
      { status: 500 }
    );
  }
}
