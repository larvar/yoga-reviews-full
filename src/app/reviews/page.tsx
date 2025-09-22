// FILE: src/app/reviews/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type R = {
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

export default function ReviewsIndex() {
  const [rows, setRows] = useState<R[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("reviews_with_instructor")
        .select("id,created_at,name,rating,title,comment,image_url,instructor_slug,instructor_name")
        .eq("approved", true)
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) setErr(error.message);
      else setRows((data || []) as any[]);
    })();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Reviews</h1>
      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Link key={r.id} href={`/reviews/${r.id}`} className="rounded border bg-white p-3 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.image_url || "/review-placeholder.jpg"}
                alt=""
                className="w-14 h-14 object-cover rounded border"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong>{r.title || r.instructor_name || "Review"}</strong>
                  <span className="text-yellow-600">
                    {"★".repeat(r.rating)}
                    <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString()}
                  {r.instructor_name ? ` · ${r.instructor_name}` : ""}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
