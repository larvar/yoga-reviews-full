// FILE: src/app/instructors/[slug]/review/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Inst = { id: string; slug: string | null; display_name: string | null };

export default function InstructorReviewPage({ params }: { params: { slug: string } }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [inst, setInst] = useState<Inst | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadErr(null);
      const { data, error } = await supabase
        .from("instructors")
        .select("id, slug, display_name")
        .eq("slug", params.slug)
        .maybeSingle();

      if (error || !data) {
        setLoadErr(error?.message || "Instructor not found.");
        setLoading(false);
        return;
      }
      setInst(data as Inst);
      setLoading(false);
    })();
  }, [params.slug, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inst?.id) return;
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
        p_instructor_id: inst.id,         // tie to this instructor
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

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (loadErr) return <main className="max-w-3xl mx-auto p-6 text-red-600">Error: {loadErr}</main>;
  if (!inst) return <main className="max-w-3xl mx-auto p-6">Not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="mb-4">
        <Link href={`/instructors/${inst.slug || ""}`} className="text-sm underline">
          ← Back to {inst.display_name || "Instructor"}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-2">
        Review {inst.display_name || "Instructor"}
      </h1>

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
            rows={5}
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
    </main>
  );
}
