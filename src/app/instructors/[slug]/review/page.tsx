// FILE: src/app/instructors/[slug]/review/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const LOCATIONS = [
  "Unknown / Other",
  "Irvine – Barranca",
  "Irvine – Culver",
  "Irvine – Spectrum",
  "Irvine – Harvard",
  "Tustin – The Marketplace",
  "Costa Mesa – Harbor",
  "Newport Beach – Westcliff",
];

export default function ReviewForInstructor({ params }: { params: { slug: string } }) {
  const [instId, setInstId] = useState<string | null>(null);
  const [instName, setInstName] = useState<string>("Instructor");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("instructors")
        .select("id, display_name")
        .eq("slug", params.slug)
        .eq("approved", true)
        .eq("visible", true)
        .maybeSingle();
      if (error || !data) {
        setErr(error?.message || "Instructor not found.");
      } else {
        setInstId(data.id);
        setInstName(data.display_name || "Instructor");
      }
      setLoading(false);
    })();
  }, [params.slug]);

  const canSubmit = useMemo(() => {
    return instId && rating >= 1 && rating <= 5 && (title.trim().length > 0 || comment.trim().length > 0);
  }, [instId, rating, title, comment]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instId) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in to leave a review.");

      let image_url: string | null = null;
      if (file) {
        const safe = file.name.replace(/\s+/g, "-");
        const path = `reviews/${auth.user.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("review-images")
          .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        const { data: url } = supabase.storage.from("review-images").getPublicUrl(path);
        image_url = url.publicUrl;
      }

      const payload: any = {
        instructor_id: instId,
        title: title.trim() || null,
        comment: comment.trim() || null,
        rating,
        image_url,
        location, // remove if you don't have this column
      };

      const { error: insErr } = await supabase.from("reviews").insert(payload);
      if (insErr) throw insErr;

      setMsg("Thanks! Your review was submitted and is pending approval.");
      setTitle("");
      setComment("");
      setRating(5);
      setLocation(LOCATIONS[0]);
      setFile(null);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-3xl mx-auto p-6 text-red-600">Error: {err}</main>;
  if (!instId) return <main className="max-w-3xl mx-auto p-6">Not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Review {instName}</h1>
      <Link href={`/instructors/${params.slug}`} className="text-sm underline">
        ← Back to profile
      </Link>

      {msg && <div className="rounded border border-green-200 bg-green-50 p-2 text-green-700 text-sm">{msg}</div>}
      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{err}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value, 10))}
            className="rounded border px-2 py-1 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "star" : "stars"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Great class!"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={4}
            placeholder="What did you like? Anything to improve?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Location (optional)</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block"
          />
          {file && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="preview"
              src={URL.createObjectURL(file)}
              className="mt-2 h-28 w-28 rounded object-cover border"
              style={{ objectPosition: "center top" }}
            />
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </form>
    </main>
  );
}
