// FILE: src/app/admin/reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  created_at: string;
  name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  image_url: string | null;
  approved: boolean;
  hidden: boolean;
  instructor_slug: string | null;
  instructor_name: string | null;
};

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("reviews_with_instructor")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) setErr(error.message);
      else setRows((data || []) as Row[]);
    })();
  }, []);

  async function approve(id: string, val: boolean) {
    setBusyId(id);
    const { error } = await supabase.rpc("admin_update_review_flags", {
      p_approved: val,
      p_hidden: null,
      p_id: id,
    });
    if (!error) setRows(s => s.map(r => r.id === id ? { ...r, approved: val } : r));
    setBusyId(null);
  }

  async function hide(id: string, val: boolean) {
    setBusyId(id);
    const { error } = await supabase.rpc("admin_update_review_flags", {
      p_approved: null,
      p_hidden: val,
      p_id: id,
    });
    if (!error) setRows(s => s.map(r => r.id === id ? { ...r, hidden: val } : r));
    setBusyId(null);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin · Reviews</h1>
      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded border p-3 bg-white">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image_url || "/placeholder.jpg"} alt="" className="w-16 h-16 object-cover rounded border" />
              <div className="flex-1">
                <div className="flex gap-2 items-center">
                  <strong>{r.title || "(no title)"}</strong>
                  <span className="text-yellow-700">
                    {"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {(r.name || "Anonymous")} {r.instructor_name ? `· ${r.instructor_name}` : ""}
                  {r.instructor_slug ? ` · /instructors/${r.instructor_slug}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => approve(r.id, !r.approved)} disabled={busyId === r.id}
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
                  {r.approved ? "Unapprove" : "Approve"}
                </button>
                <button onClick={() => hide(r.id, !r.hidden)} disabled={busyId === r.id}
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
                  {r.hidden ? "Unhide" : "Hide"}
                </button>
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
