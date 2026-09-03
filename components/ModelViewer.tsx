"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ModelViewer({
  modelUrl,
  onUploadedModel,
}: {
  modelUrl?: string | null;
  onUploadedModel?: (url: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [source, setSource] = useState(modelUrl || "");
  const [status, setStatus] = useState("Load a .GLB or .GLTF model.");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (modelUrl) setSource(modelUrl);
  }, [modelUrl]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    camera.position.set(0, 0.6, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = "viewerCanvas";

    const hemi = new THREE.HemisphereLight(0xffffff, 0x111827, 2.2);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(4, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8b5cf6, 2.2);
    fill.position.set(-3, 1, -2);
    scene.add(fill);

    const root = new THREE.Group();
    scene.add(root);

    let object: THREE.Object3D | null = null;
    if (!source) {
      const geo = new THREE.IcosahedronGeometry(0.72, 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x262c38,
        roughness: 0.35,
        metalness: 0.15,
      });
      object = new THREE.Mesh(geo, mat);
      root.add(object);
    } else {
      setStatus("Loading 3D model…");
      const loader = new GLTFLoader();
      loader.load(
        source,
        (gltf) => {
          object = gltf.scene;
           gltf.scene.rotation.z = Math.PI;
          root.add(gltf.scene);

          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          gltf.scene.position.sub(center);
          const max = Math.max(size.x, size.y, size.z) || 1;
          const scale = 1.7 / max;
          gltf.scene.scale.setScalar(scale);
          setStatus("3D model loaded. Drag to rotate; scroll to zoom.");
        },
        undefined,
        (err) => {
          console.error(err);
          setStatus("Could not load this model. Try a GLB file first.");
        }
      );
    }

    let yaw = -0.45;
    let pitch = 0.25;
    let distance = 3.2;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch += (e.clientY - lastY) * 0.008;
      pitch = Math.max(-1.2, Math.min(1.2, pitch));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance += Math.sign(e.deltaY) * 0.25;
      distance = Math.max(1.5, Math.min(6, distance));
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const draw = () => {
      root.rotation.y = yaw;
      root.rotation.x = pitch;
      camera.position.z = distance;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      scene.traverse((node: any) => {
        if (node.geometry?.dispose) node.geometry.dispose();
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((m: any) => m.dispose?.());
        }
      });
      host.replaceChildren();
    };
  }, [source]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setStatus("Uploading model…");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setSource(data.url);
      onUploadedModel?.(data.url);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="viewerWrap" ref={hostRef}>
        <div className="viewerHint">{status}</div>
      </div>
      <div className="viewerControls">
        <label className="secondary">
          {uploading ? "Uploading…" : "Upload GLB/GLTF"}
          <input
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            hidden
            disabled={uploading}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        {source && (
          <button className="secondary" onClick={() => setSource("")}>
            Clear model
          </button>
        )}
      </div>
    </>
  );
}
