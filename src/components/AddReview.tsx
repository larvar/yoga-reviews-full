// FILE: src/components/AddReview.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LAF_LOCATIONS } from "@/lib/lafLocations";

type Instructor = { id: string; name: string | null; slug: string | null };

export default function AddReview({
  open,
  onClose,
  instructorId, // optional preselect when launched from instructor page
}: {
  open: boolean;
  onClose: () => void;
  instructorId?: string | null;
}) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>(""); // "" -> Unknown/Other
  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [location, setLocation] = useState<string>("Unknown / Other");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Load instructors
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id,name,slug")
        .eq("approved", true)
        .eq("visible", true)
        .order("name", { ascending: true });

      if (!cancelled) {
        if (error) setErr(error.message);
        else setInstructors(data || []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Respect preselected instructor when opened from instructor page
  useEffect(() => {
    setSelectedInstructor(instructorId ?? "");
  }, [instructorId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const payload = {
        instructor_id: selectedInstructor || null, // empty string -> NULL
        name: name || null,
        rating,
        title: title || null,
        comment: comment || null,
        image_url: null,
        location: location || null,
        status: "pending" as const,
      };

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;

      setMsg("Thanks! Your review was submitted and is pending approval.");
      setName("");
      setRating(5);
      setTitle("");
      setComment("");
      setLocation("Unknown / Other");
      // keep selectedInstructor as-is
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="mx-auto mt-20 max-w-lg rounded-xl border bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leave a Review</h2>
          <button
            className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-3 space-y-3">
          {/* Instructor */}
          <label className="block">
            <div className="text-sm mb-1">Instructor</div>
            <select
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">Unknown / Other</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name || "(Unnamed instructor)"} {i.slug ? `— ${i.slug}` : ""}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Not sure who taught? Keep “Unknown / Other.”
            </div>
          </label>

          {/* Location */}
          <label className="block">
            <div className="text-sm mb-1">Location</div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {LAF_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Choose the LA Fitness club where class was taken.
            </div>
          </label>

          {/* Name (optional) */}
          <label className="block">
            <div className="text-sm mb-1">Your name (optional)</div>
            <input
              className="w-full rounded border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane D."
            />
          </label>

          {/* Rating */}
          <label className="block">
            <div className="text-sm mb-1">Rating</div>
            <select
              className="w-full rounded border px-3 py-2"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} / 5
                </option>
              ))}
            </select>
          </label>

          {/* Title */}
          <label className="block">
            <div className="text-sm mb-1">Title</div>
            <input
              className="w-full rounded border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Great class!"
            />
          </label>

          {/* Comment */}
          <label className="block">
            <div className="text-sm mb-1">Comment</div>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like? Any helpful context?"
            />
          </label>

          {err && (
            <div className="rounded border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
