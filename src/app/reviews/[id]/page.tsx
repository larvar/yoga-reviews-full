// FILE: src/app/reviews/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Row = {
  id: string;
  created_at: string;
  name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  image_url: string | null;
  instructor_slug: string | null;
  instructor_name: string | null;
};

export default function ReviewDetail({ params }: { params: { id: string } }) {
  const [row, setRow] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("reviews_with_instructor")
        .select("id,created_at,name,rating,title,comment,image_url,instructor_slug,instructor_name,approved,hidden")
        .eq("id", params.id)
        .maybeSingle();
      if (error) setErr(error.message);
      else if (data && data.approved && !data.hidden) setRow(data as any);
      else setErr("Review not available.");
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-3xl mx-auto p-6 text-red-600">Error: {err}</main>;
  if (!row) return <main className="max-w-3xl mx-auto p-6">Not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="mb-2 text-sm text-gray-600">
        {row.instructor_slug ? (
          <Link className="underline" href={`/instructors/${row.instructor_slug}`}>
            {row.instructor_name}
          </Link>
        ) : (
          "Unknown / Other"
        )}
        {" · "}
        {new Date(row.created_at).toLocaleString()}
      </div>

      <h1 className="text-2xl font-bold">{row.title || "Review"}</h1>

      {/* Shrunk image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={row.image_url || "/review-placeholder.jpg"}
        alt={row.title || "Review"}
        className="w-full max-w-sm h-60 object-cover rounded border mx-auto"
      />

      <div className="text-yellow-600">
        {"★".repeat(row.rating)}
        <span className="text-gray-300">{"★".repeat(5 - row.rating)}</span>
      </div>

      <p className="whitespace-pre-wrap">{row.comment}</p>
    </main>
  );
}
