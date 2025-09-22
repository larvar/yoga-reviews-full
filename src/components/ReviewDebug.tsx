// FILE: src/components/ReviewDebug.tsx  (optional helper while we troubleshoot)
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
  approved?: boolean;
  hidden?: boolean;
};

export default function ReviewDebug({ instructorId }: { instructorId?: string }) {
  const [rows, setRows] = useState<Review[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const q = supabase
        .from("reviews")
        .select("id,instructor_id,name,rating,title,comment,image_url,created_at,approved,hidden")
        .eq("approved", true).eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data, error } = instructorId ? await q.eq("instructor_id", instructorId) : await q;

      if (error) setErr(error.message);
      else setRows((data || []) as Review[]);
      setLoading(false);
    })();
  }, [instructorId]);

  return (
    <div className="mt-6 rounded-md border bg-white p-3 text-sm">
      <div className="mb-2 font-medium">ReviewDebug {instructorId ? "(by instructor)" : "(global)"}:</div>
      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}
      {!loading && !err && (
        <div>
          <div className="mb-2 text-gray-600">rows: {rows.length}</div>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded border p-2">
                <div>{r.title || "(no title)"} · {r.rating}★ · {new Date(r.created_at).toLocaleString()}</div>
                <div className="text-xs text-gray-500">id: {r.id} · inst: {r.instructor_id || "NULL"}</div>
                {r.comment && <div className="text-xs mt-1">{r.comment}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
