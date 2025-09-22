// FILE: src/components/AddReview.tsx
// Review modal with LA Fitness (SoCal) location dropdown + safe RPC insert.

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InstructorOpt = { id: string; label: string };
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Simple curated list of LA Fitness locations in Southern California
const LAF_LOCATIONS = [
  "Unknown / General",
  "Downtown Los Angeles",
  "Hollywood",
  "Westwood",
  "Santa Monica",
  "Culver City",
  "Pasadena",
  "Glendale",
  "Burbank",
  "Long Beach - Downtown",
  "Torrance",
  "Huntington Beach",
  "Newport Beach",
  "Costa Mesa",
  "Irvine - Spectrum",
  "Irvine - Northpark",
  "Irvine - Crossroads",
  "Irvine - Alicia",
  "Irvine - Michaelson",
  "Irvine - Lake Forest",
  "Irvine - Irvine East",
  "Irvine - Jamboree",
  "Irvine - Fountain Valley",
  "Anaheim",
  "Fullerton",
  "Garden Grove",
  "Santa Ana",
  "Mission Viejo",
  "Laguna Niguel",
  "San Clemente",
  "Oceanside",
  "Carlsbad",
  "Encinitas",
  "San Diego - Mission Valley",
  "San Diego - UTC",
];

export default function AddReview({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [instructors, setInstructors] = useState<InstructorOpt[]>([]);
  const [instId, setInstId] = useState<string>("unknown"); // "unknown" or UUID (or stray label—RPC handles)
  const [location, setLocation] = useState<string>("Unknown / General");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, display_name, slug")
        .eq("approved", true)
        .eq("visible", true)
        .is("deleted_at", null)
        .order("display_name", { ascending: true });
      if (error) {
        setErr(error.message);
        setInstructors([]);
        return;
      }
      const opts: InstructorOpt[] = (data ?? []).map((r: any) => ({
        id: r.id,
        label: r.display_name || r.slug || "Instructor",
      }));
      setInstructors(opts);
    })();
  }, [open]);

  const canSubmit = useMemo(
    () => !busy && rating >= 1 && rating <= 5 && comment.trim().length > 0,
    [busy, rating, comment]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!canSubmit) return;

    // prepare UUID vs text for RPC
    const isUnknown = instId === "unknown";
    let instructor_uuid: string | null = null;
    let instructor_text: string | null = null;
    if (isUnknown) {
      instructor_text = "Unknown / Other";
    } else {
      instructor_text = instId;
      instructor_uuid = UUID_RE.test(instId) ? instId : null;
    }

    setBusy(true);
    try {
      // optional single photo upload
      let image_url: string | null = null;
      if (file) {
        const safe = file.name.replace(/\s+/g, "-");
        const path = `reviews/${instructor_uuid ?? "unknown"}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("instructor-photos")
          .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("instructor-photos").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      // call safe RPC (now supports p_location)
      const { error } = await supabase.rpc("create_review_safe", {
        p_instructor_text: instructor_text,
        p_instructor_id: instructor_uuid,
        p_name: name.trim() || null,
        p_rating: rating,
        p_title: title.trim() || null,
        p_comment: comment.trim(),
        p_image_url: image_url,
        p_status: "pending",
        p_location: location || null,
      });
      if (error) throw error;

      setMsg("Thanks! Your review was submitted.");
      setName(""); setTitle(""); setComment(""); setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setLocation("Unknown / General");

      setTimeout(() => { onClose(); setMsg(null); }, 800);
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div aria-modal role="dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,92vw)] rounded-2xl border bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <button onClick={onClose} className="rounded border px-2 py-1 text-sm hover:bg-gray-50">Close</button>
        </div>

        {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{msg}</div>}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Instructor</label>
              <select className="mt-1 w-full rounded-md border px-3 py-2" value={instId} onChange={(e) => setInstId(e.target.value)}>
                <option value="unknown">Unknown / Other</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">LA Fitness Location</label>
              <select className="mt-1 w-full rounded-md border px-3 py-2" value={location} onChange={(e) => setLocation(e.target.value)}>
                {LAF_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Your name (optional)</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Alex" />
            </div>
            <div>
              <label className="block text-sm font-medium">Rating</label>
              <select className="mt-1 w-full rounded-md border px-3 py-2" value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Title (optional)</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Great class!" />
          </div>

          <div>
            <label className="block text-sm font-medium">Comment</label>
            <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or not like?" required />
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
              <img src={previewUrl} alt="Preview" className="mt-2 w-40 aspect-[4/3] object-cover rounded border" />
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={!canSubmit} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
              {busy ? "Submitting…" : "Submit review"}
            </button>
            <button type="button" onClick={onClose} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
