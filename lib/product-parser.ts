export type ImportedProduct = {
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string;
  price: string | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function meta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

function findJsonLd(html: string): any[] {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects: any[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      if (Array.isArray(parsed)) objects.push(...parsed);
      else objects.push(parsed);
    } catch {}
  }
  return objects.flatMap((obj) => Array.isArray(obj?.["@graph"]) ? obj["@graph"] : [obj]);
}

function productObject(objects: any[]) {
  return objects.find((o) => {
    const t = o?.["@type"];
    return t === "Product" || (Array.isArray(t) && t.includes("Product"));
  });
}

function stringImage(image: unknown): string | null {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image.find((x) => typeof x === "string");
    return typeof first === "string" ? first : null;
  }
  if (image && typeof image === "object" && "url" in image) {
    const url = (image as { url?: unknown }).url;
    return typeof url === "string" ? url : null;
  }
  return null;
}

export function parseProductPage(html: string, sourceUrl: string): ImportedProduct {
  const objects = findJsonLd(html);
  const product = productObject(objects);

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const name =
    product?.name ||
    meta(html, "og:title") ||
    (titleTag ? decodeHtml(titleTag.replace(/\s+/g, " ")) : null) ||
    new URL(sourceUrl).hostname;

  const brand =
    (typeof product?.brand === "string" ? product.brand : product?.brand?.name) ||
    meta(html, "product:brand") ||
    null;

  const image =
    stringImage(product?.image) ||
    meta(html, "og:image") ||
    meta(html, "twitter:image") ||
    null;

  const description =
    product?.description ||
    meta(html, "og:description") ||
    meta(html, "description") ||
    null;

  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const priceValue = offer?.price ?? meta(html, "product:price:amount");
  const currency = offer?.priceCurrency ?? meta(html, "product:price:currency");
  const price = priceValue ? `${currency ? `${currency} ` : ""}${priceValue}` : null;

  return {
    name: String(name).slice(0, 240),
    brand: brand ? String(brand).slice(0, 120) : null,
    description: description ? String(description).slice(0, 1200) : null,
    image_url: image ? new URL(image, sourceUrl).toString() : null,
    source_url: sourceUrl,
    price,
  };
}
