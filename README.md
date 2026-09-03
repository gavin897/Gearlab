# GearLab — Cloudflare Workers + Supabase

This is the first real GearLab foundation. It is **not** a standalone HTML demo.

## What already works

- Cloudflare/Workers-compatible Next.js-style app through **vinext**
- Supabase connection health check
- Server-side product URL importer (JSON-LD / Open Graph metadata)
- Save imported products to Supabase
- Load saved products from Supabase
- Delete products
- Upload PNG/JPG/WEBP/GLB/GLTF files to Supabase Storage
- Real Three.js WebGL GLB/GLTF viewer
- Modular UI/navigation

## Important limitation of product importing

Some stores deliberately block automated requests. GearLab cannot legally/reliably bypass every anti-bot system. The importer works when a product page allows the Worker to retrieve its HTML and exposes useful metadata. When a store blocks it, use image upload or later add an approved product-data provider.

## FIRST-TIME SETUP

### 1. Put these files into your GitHub `Gearlab` repository

Your repository root should contain `package.json`, `vite.config.ts`, `wrangler.jsonc`, `app/`, `components/`, etc.

### 2. Run the Supabase SQL

Open:

Supabase -> SQL Editor -> New query

Copy everything in:

`supabase/setup.sql`

and click **Run** once.

### 3. Add your two variables to Cloudflare

In your GearLab Worker:

Settings -> Variables and Secrets

Add:

`NEXT_PUBLIC_SUPABASE_URL`

Value: your Supabase Project URL.

Add:

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Value: your `sb_publishable_...` key.

Do NOT use `sb_secret_...`.

### 4. Cloudflare build settings

For a Git-connected Worker, use:

- Install command: `npm install`
- Build command: `npm run build`
- Deploy command: `npm run deploy`

If Cloudflare's Git integration exposes only a Build command, use `npm run build`; the Workers integration can handle the deployment according to the project configuration.

Node compatibility is already enabled in `wrangler.jsonc`.

### 5. Test

Open the deployed `*.workers.dev` address.

Go to **Settings** -> **Test Supabase Connection**.

You want:

`Connected to Supabase.`

Then try:

1. Upload a picture.
2. Paste a product URL.
3. Save the imported product.
4. Refresh the page.
5. Confirm the product is still there.
6. Upload a `.glb` model in the 3D Viewer.

## Cloudflare's current Next.js path

This project is configured around Cloudflare's current recommended `vinext` Workers path.

## Security note

The SQL policies in this starter are intentionally open because this is a personal prototype using only a publishable key. **Do not treat this as production multi-user security.** Before putting private data into the app or sharing it publicly, the next stage is Supabase Auth + per-user Row Level Security.

## Do not commit keys

Never paste your Supabase keys directly into source files.
Use Cloudflare Variables and Secrets.
