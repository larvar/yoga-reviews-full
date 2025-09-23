// FILE: src/components/AddReview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  instructorId?: string | null; // omit or null for general review
};

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

export default function AddReview({ open, onClose, instructorId = null }: Props) {
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // reset when opened/closed
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setComment("");
    setRating(5);
    setLocation(LOCATIONS[0]);
    setFile(null);
    setBusy(false);
    setMsg(null);
    setErr(null);
  }, [open]);

  const canSubmit = useMemo(() => {
    return rating >= 1 && rating <= 5 && (title.trim().length > 0 || comment.trim().length > 0);
  }, [rating, title, comment]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      // must be signed in
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in to leave a review.");

      // optional upload
      let image_url: string | null = null;
      if (file) {
        const safeName = file.name.replace(/\s+/g, "-");
        const path = `reviews/${auth.user.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("review-images")
          .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        const { data: url } = supabase.storage.from("review-images").getPublicUrl(path);
        image_url = url.publicUrl;
      }

      // insert (trigger fills reviewer_user_id; defaults set status='pending', hidden=false)
      const payload: any = {
        instructor_id: instructorId ?? null,
        title: title.trim() || null,
        comment: comment.trim() || null,
        rating,
        image_url,
        location: location || null, // if you have this column in reviews; else remove
      };

      const { error: insErr } = await supabase.from("reviews").insert(payload);
      if (insErr) throw insErr;

      setMsg("Thanks! Your review was submitted and is pending approval.");
      // quick reset but keep the modal open so user sees the message
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

  if (!open) return null;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Leave a Review</h2>
          <button className="rounded border px-2 py-1 text-sm hover:bg-gray-50" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Context note */}
        <p className="text-xs text-gray-600 mb-3">
          {instructorId
            ? "This review will be linked to the selected instructor."
            : "This is a general review not tied to a specific instructor."}
        </p>

        {err && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
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

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || busy}
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
