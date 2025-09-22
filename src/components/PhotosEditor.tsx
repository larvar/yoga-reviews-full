// FILE: src/components/PhotosEditor.tsx
// MULTI: choose multiple files + preview grid + bulk upload with progress
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PhotoRow = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  deleted_at?: string | null;
};

type PendingItem = {
  id: string;             // local id
  file: File;
  previewUrl: string;     // object URL
  caption: string;        // optional per-file caption
  status: "ready" | "optimizing" | "uploading" | "done" | "error";
  progress: number;       // 0..100 (best-effort)
  error?: string | null;
};

const MAX_DIMENSION = 1600;
const TARGET_MAX_BYTES = 800_000;
const MIN_QUALITY = 0.6;
const START_QUALITY = 0.82;

export default function PhotosEditor({ instructorId }: { instructorId: string }) {
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [undoPhoto, setUndoPhoto] = useState<{ id: string } | null>(null);

  const dragId = useRef<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  async function refresh() {
    const { data, error } = await supabase
      .from("instructor_photos")
      .select("id, url, caption, sort_order, deleted_at")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) setErr(error.message);
    setRows((data || []) as PhotoRow[]);
  }

  function onChooseFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const items: PendingItem[] = [];
    for (const f of Array.from(files)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      items.push({
        id,
        file: f,
        previewUrl: URL.createObjectURL(f),
        caption: "",
        status: "ready",
        progress: 0,
      });
    }
    setPending((prev) => [...prev, ...items]);
  }

  function clearPending() {
    pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
  }

  async function uploadOne(item: PendingItem, index: number) {
    try {
      setPending((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "optimizing", progress: 10 } : p))
      );

      const { blob, kind } = await optimizeImage(item.file);

      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "uploading", progress: 30 } : p
        )
      );

      const ext = kind === "jpeg" ? "jpg" : "webp";
      const path = `${instructorId}/${Date.now()}-${safeName(item.file.name, ext)}`;

      const { error: upErr } = await supabase.storage
        .from("instructor-photos")
        .upload(path, blob, { contentType: kind === "jpeg" ? "image/jpeg" : "image/webp" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("instructor-photos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Insert DB row and get its id
      const { data: inserted, error: insErr } = await supabase
        .from("instructor_photos")
        .insert({
          instructor_id: instructorId,
          url: publicUrl,
          caption: item.caption.trim() || null,
          sort_order: rows.length + index,
        })
        .select("id")
        .single();

      if (insErr) throw insErr;

      // ✅ If the instructor has no cover yet, set this photo as cover immediately
      const { data: irow } = await supabase
        .from("instructors")
        .select("id, photo_url")
        .eq("id", instructorId)
        .maybeSingle();

      if (irow && !irow.photo_url) {
        // Prefer RPC if you created it; else direct update.
        const tryRpc = await supabase.rpc("owner_set_cover_photo", {
          p_instructor_id: instructorId,
          p_photo_id: inserted?.id,
        });

        if (tryRpc.error) {
          await supabase
            .from("instructors")
            .update({ photo_url: publicUrl })
            .eq("id", instructorId);
        }
      }

      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "done", progress: 100 } : p
        )
      );
    } catch (e: any) {
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "error", progress: 100, error: e.message || String(e) } : p
        )
      );
      throw e;
    }
  }

  async function uploadAll() {
    if (pending.length === 0) return;
    setErr(null);
    setStatus(`Uploading ${pending.length} photo(s)…`);

    const toUpload = pending.filter((p) => p.status === "ready" || p.status === "error");
    let i = 0;
    for (const item of toUpload) {
      try {
        await uploadOne(item, i);
        i++;
      } catch {
        // continue; failures are shown in UI
      }
    }
    setStatus("Refreshing…");
    await refresh();
    setStatus("Done ✅");
    setPending((prev) => prev.filter((p) => p.status !== "done"));
  }

  async function saveCaption(id: string, value: string) {
    const prev = rows;
    setRows(prev.map((r) => (r.id === id ? { ...r, caption: value } : r)));
    const { error } = await supabase
      .from("instructor_photos")
      .update({ caption: value || null })
      .eq("id", id);
    if (error) {
      setErr(error.message);
      setRows(prev); // revert
    }
  }

  async function setCover(id: string) {
    const { error } = await supabase.rpc("owner_set_cover_photo", {
      p_instructor_id: instructorId,
      p_photo_id: id,
    });
    if (error) setErr(error.message);
  }

  async function softDelete(id: string) {
    const prev = rows;
    setRows(prev.filter((r) => r.id !== id));
    const { error } = await supabase.rpc("owner_soft_delete_photo", { p_photo_id: id });
    if (error) {
      setErr(error.message);
      setRows(prev);
      return;
    }
    setUndoPhoto({ id });
    setTimeout(() => setUndoPhoto(null), 5000);
    await saveOrder(prev.filter((r) => r.id !== id));
  }

  async function undoDelete() {
    if (!undoPhoto) return;
    const { error } = await supabase.rpc("owner_restore_photo", { p_photo_id: undoPhoto.id });
    setUndoPhoto(null);
    if (error) setErr(error.message);
    else refresh();
  }

  // drag & drop reordering of SAVED photos
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (_: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (overId: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === overId) return;

    const arr = [...rows];
    const fi = arr.findIndex((r) => r.id === from);
    const ti = arr.findIndex((r) => r.id === overId);
    if (fi < 0 || ti < 0) return;

    const [moved] = arr.splice(fi, 1);
    arr.splice(ti, 0, moved);
    const reindexed = [...arr];
    setRows(reindexed);
    await saveOrder(reindexed);
  };

  async function saveOrder(ordered: PhotoRow[]) {
    setSavingOrder(true);
    setErr(null);
    const { error } = await supabase.rpc("reorder_instructor_photos", {
      p_instructor_id: instructorId,
      p_ids: ordered.map((r) => r.id),
    });
    if (error) setErr(error.message);
    setSavingOrder(false);
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Photos</h2>

      {/* Select multiple files */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onChooseFiles(e.target.files)}
          className="text-sm"
        />
        <button
          onClick={uploadAll}
          disabled={pending.length === 0}
          className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
        >
          {pending.length === 0 ? "Add Photos" : `Add ${pending.length} Photo(s)`}
        </button>
        {pending.length > 0 && (
          <button
            onClick={clearPending}
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Pending previews list */}
      {pending.length > 0 && (
        <div className="rounded-lg border p-3 space-y-3 bg-white/70">
          <div className="text-sm text-gray-700">
            Selected {pending.length} file(s). Set captions, then click <b>Add Photos</b>.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pending.map((p) => (
              <div key={p.id} className="rounded-lg border overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-2 text-xs flex flex-col gap-2">
                  <div className="truncate">{p.file.name}</div>
                  <input
                    className="rounded border px-2 py-1"
                    placeholder="Caption (optional)"
                    value={p.caption}
                    onChange={(e) =>
                      setPending((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x))
                      )
                    }
                  />
                  <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-gray-600"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="min-h-[1.25rem]">
                    {p.status === "error" ? (
                      <span className="text-red-600">Error: {p.error}</span>
                    ) : (
                      <span className="text-gray-600">{labelForStatus(p.status)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(status || savingOrder) && (
        <div className="text-sm text-gray-600">
          {status} {savingOrder ? "Saving order…" : ""}
        </div>
      )}
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {undoPhoto && (
        <div className="text-sm">
          Photo removed.{" "}
          <button onClick={undoDelete} className="underline">
            Undo
          </button>
        </div>
      )}

      {/* SAVED gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div
            key={r.id}
            draggable
            onDragStart={onDragStart(r.id)}
            onDragOver={onDragOver(r.id)}
            onDrop={onDrop(r.id)}
            className="relative rounded-lg overflow-hidden border bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.url}
              alt={r.caption || ""}
              className="aspect-[4/3] w-full object-cover pointer-events-none select-none"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/90 px-2 py-1 text-xs">
              <input
                className="bg-transparent outline-none w-full mr-2"
                value={r.caption || ""}
                placeholder="Caption…"
                onChange={(e) =>
                  setRows(rows.map((x) => (x.id === r.id ? { ...x, caption: e.target.value } : x)))
                }
                onBlur={(e) => saveCaption(r.id, e.target.value)}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => setCover(r.id)}
                  className="rounded border px-2 py-0.5"
                  title="Set as cover"
                >
                  Cover
                </button>
                <button
                  onClick={() => softDelete(r.id)}
                  className="rounded border px-2 py-0.5 hover:bg-red-50"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Select multiple files → set captions → Add Photos. Drag saved thumbnails to reorder.
      </p>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function labelForStatus(s: PendingItem["status"]) {
  switch (s) {
    case "ready": return "Ready";
    case "optimizing": return "Optimizing…";
    case "uploading": return "Uploading…";
    case "done": return "Uploaded";
    case "error": return "Error";
    default: return "";
  }
}

function safeName(original: string, forceExt: string) {
  const base = original.replace(/\.[a-z0-9]+$/i, "");
  const clean = base.toLowerCase().replace(/[^a-z0-9\-_.]+/g, "-").slice(0, 80);
  return `${clean || "photo"}.${forceExt}`;
}

async function optimizeImage(file: File): Promise<{
  blob: Blob;
  kind: "jpeg" | "webp";
}> {
  const bmp = await loadBitmap(file);
  const { canvas } = drawScaled(bmp, MAX_DIMENSION);

  const preferWebP = await hasTransparency(canvas);
  const primary = preferWebP ? "image/webp" : "image/jpeg";
  const fallback = preferWebP ? "image/jpeg" : "image/webp";

  let q = START_QUALITY;
  let blob = await toBlob(canvas, primary, q);
  for (let i = 0; i < 5 && blob.size > TARGET_MAX_BYTES && q > MIN_QUALITY; i++) {
    q = Math.max(MIN_QUALITY, q - 0.08);
    blob = await toBlob(canvas, primary, q);
  }

  if (blob.size > TARGET_MAX_BYTES * 1.2) {
    let q2 = START_QUALITY;
    let alt = await toBlob(canvas, fallback, q2);
    for (let i = 0; i < 5 && alt.size > TARGET_MAX_BYTES && q2 > MIN_QUALITY; i++) {
      q2 = Math.max(MIN_QUALITY, q2 - 0.08);
      alt = await toBlob(canvas, fallback, q2);
    }
    if (alt.size < blob.size) blob = alt;
  }

  const kind = blob.type.includes("webp") ? "webp" : "jpeg";
  return { blob, kind };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // @ts-expect-error: option might not exist in older DOM lib
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function drawScaled(bitmap: ImageBitmap, maxDim: number) {
  let { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);

  return { canvas, width: w, height: h };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), type, quality);
  });
}

async function hasTransparency(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width, height } = canvas;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 32));
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] < 255) return true;
    }
  }
  return false;
}
