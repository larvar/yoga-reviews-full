// FILE: src/components/AddReview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = {
  open: boolean;
  onClose: () => void;
  instructorId?: string | null; // leave undefined/null for general reviews
};

export default function AddReview({ open, onClose, instructorId }: Props) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setComment("");
      setRating(5);
      setImageUrl(null);
      setBusy(false);
      setErr(null);
      setOk(null);
    }
  }, [open]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        setErr("Please sign in to submit a review.");
        setBusy(false);
        return;
      }

      const { error } = await supabase.rpc("create_review_safe", {
        p_instructor_id: instructorId ?? null,      // null => general review
        p_title: title || null,
        p_comment: comment || null,
        p_rating: Number.isFinite(rating) ? rating : null,
        p_image_url: imageUrl || null,
      });

      if (error) {
        setErr(error.message);
      } else {
        setOk("Thanks! Your review was submitted and is awaiting approval.");
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm border hover:bg-gray-50">
            Close
          </button>
        </div>

        {instructorId ? (
          <div className="text-xs text-gray-600 mb-2">
            Your review will be linked to this instructor.
          </div>
        ) : (
          <div className="text-xs text-gray-600 mb-2">
            General review (not tied to a specific instructor).
          </div>
        )}

        {err && <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        {ok && <div className="mb-2 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{ok}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick summary…"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Rating</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value, 10))}
            >
              {[5,4,3,2,1].map((n) => (
                <option key={n} value={n}>{n} stars</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Comment</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like? Anything to improve?"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Photo URL (optional)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={imageUrl || ""}
              onChange={(e) => setImageUrl(e.target.value || null)}
              placeholder="https://…"
            />
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || "/review-placeholder.jpg"}
                alt="preview"
                className={`w-full rounded border ${imageUrl ? "h-40 object-cover" : "h-24 object-contain bg-white p-2"}`}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              🧘 Submit review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
