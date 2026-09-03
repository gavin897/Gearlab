import { parseProductPage } from "@/lib/product-parser";

export async function POST(request: Request) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawUrl =
    value && typeof value === "object" && "url" in value
      ? String((value as { url: unknown }).url)
      : "";

  let url: URL;
  try {
    url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    return Response.json({ error: "Enter a valid http/https product URL." }, { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GearLab/1.0; +https://workers.dev)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return Response.json(
        {
          error: `The store returned HTTP ${response.status}. Some stores block automated imports. You can still upload images manually.`,
        },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return Response.json({ error: "That URL did not return an HTML product page." }, { status: 422 });
    }

    const html = await response.text();
    if (html.length > 6_000_000) {
      return Response.json({ error: "The page is too large to import safely." }, { status: 413 });
    }

    const product = parseProductPage(html, response.url || url.toString());
    return Response.json({ product });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Import failed: ${error.message}`
            : "Import failed.",
      },
      { status: 500 }
    );
  }
}
