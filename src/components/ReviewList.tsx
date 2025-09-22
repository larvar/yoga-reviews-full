// FILE: src/components/ReviewList.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Review = {
  id: string;
  instructor_id: string | null;
  name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  image_url: string | null;
  created_at: string;
};

export default function ReviewList({
  instructorId,
  fallbackImageUrl,
}: {
  instructorId: string;
  fallbackImageUrl?: string | null;
}) {
  const [rows, setRows] = useState<Review[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("reviews")
        .select("id,instructor_id,name,rating,title,comment,image_url,created_at")
        .eq("instructor_id", instructorId)
        .eq("approved", true)
        .eq("hidden", false)
        .order("created_at", { ascending: false });

      if (error) setErr(error.message);
      else setRows((data || []) as Review[]);
      setLoading(false);
    })();
  }, [instructorId]);

  if (loading) return <div>Loading reviews…</div>;
  if (err) return <div className="text-red-600 text-sm">Error: {err}</div>;
  if (rows.length === 0) return <div>No reviews yet.</div>;

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border p-4 bg-white">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.image_url || fallbackImageUrl || "/review-placeholder.jpg"}
              alt={r.title || "Review"}
              className="w-12 h-12 object-cover rounded border"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <strong>{(r.name || "").trim() || "Anonymous"}</strong>
                <span className="text-yellow-600">
                  {"★".repeat(r.rating)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - r.rating)}
                  </span>
                </span>
              </div>
              {r.title && <div className="text-sm font-medium">{r.title}</div>}
              <div className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          {r.comment && (
            <p className="mt-2 text-sm whitespace-pre-wrap">{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
