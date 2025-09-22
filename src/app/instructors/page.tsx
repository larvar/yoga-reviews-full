// FILE: src/app/instructors/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  slug: string | null;
  display_name: string | null;
  bio: string | null;
  photo_url: string | null;
  first_photo_url: string | null;
};

export default function InstructorsIndex() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("list_instructors_with_first_photo");
      if (error) setErr(error.message);
      else setRows(data || []);
    })();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Instructors</h1>

      {err && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{err}</div>}

      {!err && (
        rows.length === 0 ? (
          <p className="text-gray-500">No published instructors yet.</p>
        ) : (
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {rows.map((i) => {
              const img = i.photo_url || i.first_photo_url || "/placeholder.png";
              return (
                <Link
                  key={i.id}
                  href={`/instructors/${i.slug ?? ""}`}
                  className="block border rounded-lg p-4 hover:shadow"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={i.display_name || "Instructor"}
                    className="w-full h-52 object-cover rounded mb-3 bg-gray-100"
                  />
                  <div className="font-semibold">{i.display_name || "(Unnamed instructor)"}</div>
                  <div className="text-xs text-gray-500">{i.slug}</div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </main>
  );
}
