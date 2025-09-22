// src/app/admin/instructors/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Instructor = {
  id: string;
  display_name: string | null;
  slug: string | null;
  bio: string | null;
  photo_url: string | null;
  approved: boolean;
  visible: boolean;
  owner_user_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function AdminInstructorsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Instructor[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("admin_list_instructors");
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setFlags(id: string, changes: Partial<Pick<Instructor, "approved" | "visible">>) {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    // optimistic update
    const optimistic = rows.map(r => r.id === id ? { ...r, ...changes } : r);
    setRows(optimistic);

    const { error } = await supabase.rpc("admin_update_instructor_flags", {
      p_id: id,
      p_approved: changes.approved ?? row.approved,
      p_visible: changes.visible ?? row.visible,
    });
    if (error) {
      setError(error.message);
      // revert on failure
      setRows(rows);
    }
  }

  async function remove(id: string) {
    const prev = rows;
    setRows(prev.filter(r => r.id !== id));
    const { error } = await supabase.rpc("admin_delete_instructor", { p_id: id });
    if (error) {
      setError(error.message);
      setRows(prev);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instructors Admin</h1>
        <div className="flex gap-3">
          <Link href="/admin/check" className="underline">Back to Admin Check</Link>
          <button
            onClick={refresh}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-600">No instructors found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md bg-white">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Approved</th>
                <th className="p-2">Visible</th>
                <th className="p-2">Owner</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b align-top">
                  <td className="p-2">
                    <div className="font-medium">{r.display_name || "—"}</div>
                    {r.bio && <div className="text-xs text-gray-500 line-clamp-2">{r.bio}</div>}
                  </td>
                  <td className="p-2">
                    {r.slug ? (
                      <Link href={`/instructors/${r.slug}`} className="underline">{r.slug}</Link>
                    ) : "—"}
                  </td>
                  <td className="p-2">
                    <span className="text-sm">{r.approved ? "Yes" : "No"}</span>
                  </td>
                  <td className="p-2">
                    <span className="text-sm">{r.visible ? "Yes" : "No"}</span>
                  </td>
                  <td className="p-2 text-xs text-gray-600">{r.owner_user_id || "—"}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFlags(r.id, { approved: !r.approved })}
                        className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                        title="Toggle approved"
                      >
                        {r.approved ? "Unapprove" : "Approve"}
                      </button>
                      <button
                        onClick={() => setFlags(r.id, { visible: !r.visible })}
                        className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                        title="Toggle visible"
                      >
                        {r.visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-md border px-2 py-1 text-sm hover:bg-red-50"
                        title="Delete instructor"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
