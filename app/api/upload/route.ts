import { uploadToSupabaseStorage } from "@/lib/supabase-rest";

const MAX_FILE = 15 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream"
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Choose a file first." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE) {
      return Response.json({ error: "File must be between 1 byte and 15 MB." }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split(".").pop();
    const isModel = ext === "glb" || ext === "gltf";
    const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext || "");

    if (!isModel && !isImage && !ALLOWED.has(file.type)) {
      return Response.json({ error: "Use PNG, JPG, WEBP, GLB, or GLTF files." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const url = await uploadToSupabaseStorage(
      file.name,
      file.type || (isModel ? "model/gltf-binary" : "application/octet-stream"),
      bytes
    );

    return Response.json({ url, kind: isModel ? "model" : "image" });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
