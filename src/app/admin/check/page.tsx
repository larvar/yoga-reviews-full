// src/app/admin/check/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type State =
  | { loading: true }
  | {
      loading: false;
      userId: string | null;
      email: string | null;
      isAdmin: boolean | null;
      error?: string | null;
    };

export default function AdminCheckPage() {
  const [state, setState] = useState<State>({ loading: true });

  useEffect(() => {
    (async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userData.user ?? null;
        const uid = user?.id ?? null;
        const email = user?.email ?? null;

        if (!uid) {
          setState({ loading: false, userId: null, email: null, isAdmin: null });
          return;
        }

        const { data: isAdmin, error: rpcErr } = await supabase.rpc("is_admin");
        if (rpcErr) throw rpcErr;

        setState({
          loading: false,
          userId: uid,
          email,
          isAdmin: Boolean(isAdmin),
        });
      } catch (e: any) {
        setState({
          loading: false,
          userId: null,
          email: null,
          isAdmin: null,
          error: e?.message ?? "Unknown error",
        });
      }
    })();
  }, []);

  if (state.loading) {
    return <div className="p-6">Checking admin status…</div>;
  }

  if (state.error) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-xl font-semibold">Admin Check</h1>
        <p className="text-red-600">Error: {state.error}</p>
      </div>
    );
  }

  if (!state.userId) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Check</h1>
        <p>You’re not logged in.</p>
        <Link href="/login" className="underline">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Check</h1>
      <div className="space-y-1">
        <div><span className="font-semibold">Email:</span> {state.email ?? "—"}</div>
        <div><span className="font-semibold">User ID:</span> {state.userId}</div>
      </div>

      {state.isAdmin ? (
        <div className="space-y-3">
          <div className="text-green-700 font-semibold">You’re an admin ✅</div>
          <div className="flex gap-3">
            <Link href="/admin/instructors" className="underline">Go to Instructors Admin</Link>
            <Link href="/admin/reviews" className="underline">Go to Reviews Admin</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-amber-700 font-semibold">You’re logged in, but not an admin.</div>
          <p>
            If this is unexpected, confirm that your UID matches the row in <code>auth_admins</code>.
          </p>
        </div>
      )}
    </div>
  );
}
