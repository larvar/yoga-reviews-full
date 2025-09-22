// FILE: src/components/PhotoPicker.tsx
// A reusable image chooser that uploads to Supabase Storage and returns the public URL(s).
// Usage:
//   <PhotoPicker
//      folder={`instructors/${instructorId}`}
//      onChange={(urls) => setCoverUrl(urls[0])}
//   />
//
//   <PhotoPicker
//      multiple
//      folder={`reviews/${instructorId ?? "unknown"}`}
//      onChange={(urls) => setGallery(urls)}
//   />

"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  folder: string;                    // storage subfolder, e.g. "instructors/<id>"
  bucket?: string;                   // default "instructor-photos"
  multiple?: boolean;                // allow multiple selections
  buttonLabel?: string;              // button text
  onChange: (urls: string[]) => void; // called with public URLs after upload
  className?: string;                // optional wrapper class
};

export default function PhotoPicker({
  folder,
  bucket = "instructor-photos",
  multiple = false,
  buttonLabel = "Choose photo",
  onChange,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setBusy(true);
    const urls: string[] = [];
    const previewUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        // quick preview
        previewUrls.push(URL.createObjectURL(f));

        // build a unique storage path
        const safe = f.name.replace(/\s+/g, "-");
        const path = `${folder}/${Date.now()}-${i}-${safe}`;

        const { error: upErr } = await supabase
          .storage
          .from(bucket)
          .upload(path, f, {
            upsert: false,
            contentType: f.type || "image/jpeg",
          });
        if (upErr) throw upErr;

        const { data: urlData } = supabase
          .storage
          .from(bucket)
          .getPublicUrl(path);

        urls.push(urlData.publicUrl);
      }

      setPreviews(previewUrls);
      onChange(urls);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        {busy ? "Uploading…" : buttonLabel}
      </label>

      {err && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full aspect-[4/3] object-cover rounded border" />
          ))}
        </div>
      )}
    </div>
  );
}
