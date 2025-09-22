// FILE: src/components/InstructorPhotosEditor.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type PhotoRow = {
  id: string;
  url: string;
  sort_order: number | null;
  caption: string | null;
  created_at: string; // ← use for cache-busting
};

export default function InstructorPhotosEditor({
  instructorId,
  onCoverChange,
}: {
  instructorId: string;
  onCoverChange?: (url: string) => void;
}) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    setErr(null);
    const [{ data: ph, error: perr }, { data: inst, error: ierr }] = await Promise.all([
      supabase
        .from("instructor_photos")
        .select("id,url,sort_order,caption,created_at")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("instructors").select("photo_url").eq("id", instructorId).maybeSingle(),
    ]);

    if (perr) setErr(perr.message);
    if (ierr) setErr(ierr.message);

    setPhotos((ph || []) as PhotoRow[]);
    setCoverUrl(inst?.photo_url ?? null);
  }, [instructorId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const nextSort = useMemo(
    () => (photos.length ? Math.max(...photos.map((p) => p.sort_order || 0)) + 1 : 1),
    [photos]
  );

  const uid = () =>
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setBusy(true);
    try {
      let firstPublicUrl: string | null = null;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const safe = f.name.replace(/\s+/g, "-");
        const path = `instructors/${instructorId}/${Date.now()}-${uid()}-${i}-${safe}`;

        const { error: upErr } = await supabase.storage
          .from("instructor-photos")
          .upload(path, f, { upsert: false, contentType: f.type || "image/jpeg" });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from("instructor-photos").getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        const { error: insErr } = await supabase
          .from("instructor_photos")
        .insert({
	  instructor_id: instructorId,
	  url: publicUrl,
	  caption: null
	});

        if (insErr) throw insErr;

        if (!firstPublicUrl) firstPublicUrl = publicUrl;
      }

      await reload(); // exact DB truth

      // If no cover set yet, promote first upload
      if (firstPublicUrl && !coverUrl) {
        const { error: upErr2 } = await supabase
          .from("instructors")
          .update({ photo_url: firstPublicUrl })
          .eq("id", instructorId);
        if (!upErr2) {
          setCoverUrl(firstPublicUrl);
          onCoverChange?.(firstPublicUrl);
        }
      }

      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function makeCover(url: string) {
    if (coverUrl === url) return;
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.from("instructors").update({ photo_url: url }).eq("id", instructorId);
      if (error) throw error;
      setCoverUrl(url);         // instant UI update
      onCoverChange?.(url);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption(id: string, caption: string) {
    const prev = photos;
    setPhotos((p) => p.map((x) => (x.id === id ? { ...x, caption } : x)));
    const { error } = await supabase.from("instructor_photos").update({ caption }).eq("id", id);
    if (error) {
      setErr(error.message);
      setPhotos(prev);
    }
  }

  async function removePhoto(id: string) {
    const prev = photos;
    setPhotos((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase
      .from("instructor_photos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setErr(error.message);
      setPhotos(prev);
    }
    await reload();
  }

  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Photos</div>
          <div className="text-xs text-gray-500">
            Add multiple photos; click “Make cover” to feature one. Captions are optional.
          </div>
        </div>
        <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => uploadFiles(e.target.files)}
            className="hidden"
          />
          {busy ? "Uploading…" : "Choose photos"}
        </label>
      </div>

      {err && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>
      )}

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p) => {
          const isCover = coverUrl && p.url === coverUrl;
          // stable cache-buster per row so each image URL is unique to that photo
          const src = `${p.url}${p.url.includes("?") ? "&" : "?"}v=${encodeURIComponent(p.created_at)}`;

          return (
            <div key={p.id} className="relative rounded border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={p.caption ?? ""}
                className="w-full aspect-[4/3] object-cover rounded border"
                style={{ objectPosition: "center top" }}
                crossOrigin="anonymous"
              />

              {isCover && (
                <span className="absolute left-2 top-2 rounded bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                  Cover
                </span>
              )}

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => makeCover(p.url)}
                  disabled={isCover || busy}
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  {isCover ? "Current cover" : "Make cover"}
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>

              {/* Caption editor */}
              <input
                className="mt-2 w-full rounded-md border px-2 py-1 text-xs"
                placeholder="Add a caption…"
                defaultValue={p.caption ?? ""}
                onBlur={(e) => saveCaption(p.id, e.target.value)}
              />

              {/* Tiny debug line — helps verify each row is unique */}
              <div className="mt-1 text-[10px] text-gray-400 break-all">
                {p.id.slice(0, 8)} · {new URL(p.url).pathname.split("/").pop()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Add more photos
        </button>
      </div>
    </div>
  );
}
