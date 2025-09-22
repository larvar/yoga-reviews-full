// FILE: src/app/instructors/[slug]/review/page.tsx
// Creates a review for the *current instructor only*.
// Sends ONLY instructor_id (UUID) — never a label — so no UUID cast errors.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Inst = {
  id: string;
  slug: string | null;
  display_name: string | null;
};

export default function CreateInstructorReview({
  params,
}: {
  params: { slug: string };
}) {
  const [inst, setInst] = useState<Inst | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("instructors")
        .select("id, slug, display_name")
        .eq("slug", params.slug)
        .eq("approved", true)
        .eq("visible", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (error || !data) {
        setErr(error?.message || "Instructor not found.");
        setLoading(false);
        return;
      }
      setInst(data as Inst);
      setLoading(false);
    })();
  }, [params.slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!inst) return;
    if (!comment.trim()) {
      setErr("Please write a comment.");
      return;
    }
    setErr(null);
    setMsg(null);
    setBusy(true);

    try {
      // optional image upload
      let image_url: string | null = null;
      if (file) {
        const safe = file.name.replace(/\s+/g, "-");
        const path = `reviews/${inst.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase
          .storage
          .from("instructor-photos")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
          });
        if (upErr) throw upErr;
        const { data: urlData } = supabase
          .storage
          .from("instructor-photos")
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      // ✅ payload: ONLY UUIDs (or null) in uuid columns
      const payload: any = {
        instructor_id: inst.id,        // <-- UUID from DB
        name: name.trim() || null,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        image_url,
        status: "pending",             // keep if you moderate
      };

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;

      setMsg("Thanks! Your review was submitted for approval.");
      setName(""); setTitle(""); setComment(""); setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-3xl mx-auto p-6 text-red-600">Error: {err}</main>;
  if (!inst) return <main className="max-w-3xl mx-auto p-6">Not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Review {inst.display_name || "Instructor"}</h1>
      <p className="text-sm text-gray-600 mb-6">
        Submitting for: <code className="px-1 py-0.5 bg-gray-100 rounded">{inst.id}</code>
        {/* ^ tiny debug so you can see we’re using a UUID */}
      </p>

      {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{msg}</div>}
      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Your name (optional)</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Rating</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value, 10))}
            >
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Title (optional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Great class!"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Comment</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or not like?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(f ? URL.createObjectURL(f) : null);
            }}
            className="mt-1"
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-2 w-40 aspect-[4/3] object-cover rounded border"
            />
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={busy || !comment.trim()}
            className="rounded-md border px-5 py-3 text-base font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit review"}
          </button>
          <Link
            href={`/instructors/${params.slug}`}
            className="rounded-md border px-5 py-3 text-base hover:bg-gray-50"
          >
            Back to profile
          </Link>
        </div>
      </form>
    </main>
  );
}
