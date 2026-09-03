"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ModelViewer from "./ModelViewer";

type Product = {
  id?: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  image_url?: string | null;
  source_url: string;
  price?: string | null;
  rating?: number | null;
  model_url?: string | null;
  created_at?: string;
};

type Health = {
  ok: boolean;
  configured: boolean;
  message: string;
};

export default function GearLab() {
  const [active, setActive] = useState("Overview");
  const [health, setHealth] = useState<Health | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [imported, setImported] = useState<Product | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [viewerModel, setViewerModel] = useState("");

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } catch {
      setHealth({ ok: false, configured: false, message: "Could not reach GearLab API." });
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch {}
  }

  useEffect(() => {
    checkHealth();
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    const rated = products.filter((p) => typeof p.rating === "number");
    const best = rated.length ? Math.max(...rated.map((p) => p.rating || 0)).toFixed(1) : "—";
    const models = products.filter((p) => p.model_url).length;
    return { total: products.length, best, models };
  }, [products]);

  async function importProduct(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setImported(null);
    setImportMessage("Importing product page from the server…");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setImported(data.product);
      setImportMessage("Product found. Review it, then click Save to Gear Library.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveImported() {
    if (!imported) return;
    setBusy(true);
    setImportMessage("Saving to Supabase…");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imported),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setImportMessage("Saved to your Gear Library.");
      setImported(null);
      setUrl("");
      await loadProducts();
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
      }
  }
     async function attachModelToProduct(product: Product, file?: File) {
  if (!file || !product.id) return;

  setUploadMessage(`Uploading 3D model for ${product.name}…`);

  try {
    const body = new FormData();
    body.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "3D model upload failed.");
    }

    const updateRes = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
     D body: JSON.stringify({
        model_url: uploadData.url,
      }),
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(updateData.error || "Could not attach 3D model.");
    }

    setViewerModel(uploadData.url);
    setUploadMessage(`3D model attached to ${product.name}.`);

    await loadProducts();
  } catch (error) {
    setUploadMessage(
      error instanceof Error ? error.message : "Could not attach 3D model."
    );
  }
}
      
      async function removeProduct(id?: string) {
  if (!id) return;
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  if (res.ok) loadProducts();
}
    

  async function uploadImage(file?: File) {
    if (!file) return;
    setUploadMessage("Uploading…");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setPreviewImage(data.url);
      setUploadMessage("Image uploaded to Supabase Storage.");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  async function removeProduct(id?: string) {
    if (!id) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) loadProducts();
  }

  const nav = ["Overview", "My Gear", "Collections", "Wishlist", "Rankings", "Compare", "3D Viewer", "Settings"];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandDot" />GEARLAB</div>
        <div className="navTitle">DASHBOARD</div>
        {nav.map((item) => (
          <button
            key={item}
            className={`navBtn ${active === item ? "active" : ""}`}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
        <div className="sidebarNote">
          This is the real hosted foundation. Once GitHub + Cloudflare are connected, future code changes can deploy automatically.
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">PERSONAL GAMING LAB</div>
            <h1>{active}</h1>
            <div className="sub">Import gear, save it, upload references, and inspect real 3D files.</div>
          </div>
          <div className="statusPill">
            <span className={`statusDot ${health?.ok ? "good" : health ? "bad" : ""}`} />
            {health?.message || "Checking Cloudflare + Supabase…"}
          </div>
        </div>

        {active === "Overview" && (
          <>
            <div className="stats">
              <div className="stat"><div className="statValue">{stats.total}</div><div className="statLabel">Saved gear</div></div>
              <div className="stat"><div className="statValue">{stats.best}</div><div className="statLabel">Best rating</div></div>
              <div className="stat"><div className="statValue">{stats.models}</div><div className="statLabel">3D models</div></div>
            </div>

            <div className="grid">
              <section className="card">
                <h2 className="cardTitle">Import a real product URL</h2>
                <div className="cardSub">
                  The request goes through your Cloudflare backend instead of your browser.
                </div>

                <form className="importRow" onSubmit={importProduct}>
                  <input
                    className="input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.logitechg.com/..."
                    required
                  />
                  <button className="primary" disabled={busy}>
                    {busy ? "Working…" : "Import"}
                  </button>
                </form>
                <div className={`message ${importMessage.toLowerCase().includes("fail") || importMessage.toLowerCase().includes("error") ? "error" : ""}`}>
                  {importMessage}
                </div>

                {imported && (
                  <div className="gear" style={{ marginTop: 12 }}>
                    {imported.image_url ? (
                      <img className="thumb" src={imported.image_url} alt="" />
                    ) : (
                      <div className="thumbFallback">?</div>
                    )}
                    <div>
                      <div className="gearName">{imported.name}</div>
                      <div className="gearMeta">
                        {imported.brand || "Brand not detected"} {imported.price ? `• ${imported.price}` : ""}
                      </div>
                      <div className="gearActions">
                        <button className="primary" onClick={saveImported} disabled={busy}>Save to My Gear</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sectionHeader" style={{ marginTop: 24 }}>
                  <div>
                    <h2 className="cardTitle">Gear Library</h2>
                    <div className="cardSub" style={{ marginBottom: 0 }}>Loaded from Supabase.</div>
                  </div>
                  <div className="count">{products.length} items</div>
                </div>

                {products.length ? (
                  <div className="gearGrid">
                    {products.map((p) => (
                      <div className="gear" key={p.id || p.source_url}>
                        {p.image_url ? (
                          <img className="thumb" src={p.image_url} alt="" />
                        ) : <div className="thumbFallback">G</div>}
                        <div>
                          <div className="gearName">{p.name}</div>
                          <div className="gearMeta">{p.brand || "Unknown brand"} {p.price ? `• ${p.price}` : ""}</div>
                          <div className="gearActions">
                            {p.model_url && <button className="secondary" onClick={() => { setViewerModel(p.model_url!); setActive("3D Viewer"); }}>View 3D</button>}
                           <label className="secondary" style={{ cursor: "pointer" }}>
  Attach 3D Model
  <input
    type="file"
    accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
    style={{ display: "none" }}
    onChange={(e) => attachModelToProduct(p, e.target.files?.[0])}
  />
</label>
                            <button className="danger" onClick={() => removeProduct(p.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty">No saved gear yet. Import your first product above.</div>
                )}
              </section>

              <aside style={{ display: "grid", gap: 18, alignContent: "start" }}>
                <section className="card">
                  <h2 className="cardTitle">Upload reference image</h2>
                  <div className="cardSub">PNG, JPG or WEBP up to 15 MB.</div>
                  <div className="uploadBox">
                    <input
                      className="fileInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => uploadImage(e.target.files?.[0])}
                    />
                    <div className={`message ${uploadMessage.toLowerCase().includes("fail") ? "error" : ""}`}>
                      {uploadMessage}
                    </div>
                    {previewImage && <img className="previewImage" src={previewImage} alt="Uploaded reference" />}
                  </div>
                </section>

                <section className="card">
                  <h2 className="cardTitle">3D system</h2>
                  <div className="cardSub">This is actual WebGL/Three.js, not the old CSS fake.</div>
                  <ModelViewer modelUrl={viewerModel} onUploadedModel={setViewerModel} />
                </section>
              </aside>
            </div>
          </>
        )}

        {active === "3D Viewer" && (
          <section className="card">
            <h2 className="cardTitle">Real GLB / GLTF Viewer</h2>
            <div className="cardSub">
              Upload a GLB first for the most reliable single-file 3D model experience.
            </div>
            <ModelViewer modelUrl={viewerModel} onUploadedModel={setViewerModel} />
          </section>
        )}

        {active === "My Gear" && (
          <section className="card">
            <div className="sectionHeader">
              <div><h2 className="cardTitle">My Gear</h2><div className="cardSub">Everything currently saved in Supabase.</div></div>
              <button className="secondary" onClick={loadProducts}>Refresh</button>
            </div>
            {products.length ? (
              <div className="gearGrid">
                {products.map((p) => (
                  <div className="gear" key={p.id || p.source_url}>
                    {p.image_url ? <img className="thumb" src={p.image_url} alt="" /> : <div className="thumbFallback">G</div>}
                    <div><div className="gearName">{p.name}</div><div className="gearMeta">{p.brand || "Unknown brand"}</div></div>
                  </div>
                ))}
              </div>
            ) : <div className="empty">No saved gear yet.</div>}
          </section>
        )}

        {["Collections","Wishlist","Rankings","Compare"].includes(active) && (
          <section className="card">
            <h2 className="cardTitle">{active}</h2>
            <div className="cardSub">
              The page is wired into the navigation, but I’m intentionally leaving its database feature set for the next stage so we do not break the core importer/storage/3D foundation.
            </div>
            <div className="small">First milestone: Cloudflare build → Supabase connection → import → save → image upload → real GLB viewer.</div>
          </section>
        )}

        {active === "Settings" && (
          <section className="card">
            <h2 className="cardTitle">Connection diagnostics</h2>
            <div className="cardSub">Use this after setting the two Supabase variables in Cloudflare.</div>
            <button className="primary" onClick={checkHealth}>Test Supabase Connection</button>
            <div className={`message ${health?.ok ? "success" : "error"}`}>{health?.message}</div>
            <div className="small" style={{ marginTop: 14 }}>
              Required variable names:<br/>
              NEXT_PUBLIC_SUPABASE_URL<br/>
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
