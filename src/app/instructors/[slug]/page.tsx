// FILE: src/app/instructors/[slug]/page.tsx
// Gallery now de-dupes the cover, includes captions, and frames heads nicer.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ReviewList from "@/components/ReviewList";

type Inst = {
  id: string;
  slug: string | null;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
};

type GPhoto = { url: string; caption: string | null };

export default function InstructorProfile({ params }: { params: { slug: string } }) {
  const [inst, setInst] = useState<Inst | null>(null);
  const [photos, setPhotos] = useState<GPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: irow, error: ierr } = await supabase
        .from("instructors")
        .select("id, slug, display_name, bio, photo_url")
        .eq("slug", params.slug)
        .eq("approved", true)
        .eq("visible", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (ierr || !irow) {
        setErr(ierr?.message || "Instructor not found.");
        setLoading(false);
        return;
      }
      setInst(irow as Inst);

      const { data: prows, error: perr } = await supabase
        .from("instructor_photos")
        .select("url, caption")
        .eq("instructor_id", irow.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (perr) {
        setErr(perr.message);
        setLoading(false);
        return;
      }

      // Build list and de-dupe if cover also appears in instructor_photos
      const seen = new Set<string>();
      const list: GPhoto[] = [];

      if (irow.photo_url) {
        seen.add(irow.photo_url);
        list.push({ url: irow.photo_url, caption: null });
      }

      (prows || []).forEach((p: any) => {
        if (!seen.has(p.url)) {
          seen.add(p.url);
          list.push({ url: p.url, caption: p.caption || null });
        }
      });

      setPhotos(list);
      setLoading(false);
    })();
  }, [params.slug]);

  if (loading) return <main className="max-w-4xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-4xl mx-auto p-6 text-red-600">Error: {err}</main>;
  if (!inst) return <main className="max-w-4xl mx-auto p-6">Not found.</main>;

  const cover = photos[0]?.url || "/placeholder.jpg";
  const displayName =
    (inst.display_name || "").trim().toLowerCase() === "unnamed instructor"
      ? "Instructor"
      : inst.display_name || "Instructor";

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
      {inst.bio && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{inst.bio}</p>}

      {/* Gallery with captions (better face framing) */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {photos.map((p, idx) => (
            <figure key={idx} className="bg-white rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || `Photo ${idx + 1}`}
                className="w-full h-48 object-cover rounded border"
                style={{ objectPosition: "center top" }}
              />
              {p.caption && (
                <figcaption className="text-xs text-gray-600 mt-1">{p.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={`/instructors/${params.slug}/review`}
          className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-base hover:bg-gray-50"
        >
          <span aria-hidden>🧘</span>
          <span>Leave a review</span>
        </Link>
        <Link
          href="/reviews"
          className="inline-block rounded-md border px-5 py-3 text-base hover:bg-gray-50"
        >
          See all reviews
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Reviews</h2>
        <ReviewList instructorId={inst.id} fallbackImageUrl={cover} />
      </section>
    </main>
  );
}
