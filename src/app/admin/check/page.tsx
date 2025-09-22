// FILE: src/app/admin/check/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type State = {
  loading: boolean;
  error?: string;

  // present when logged in
  userId?: string;
  email?: string | null;

  // present after admin check
  isAdmin?: boolean;
};

export default function AdminCheckPage() {
  const [state, setState] = useState<State>({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1) get user
        const { data: userData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const user = userData.user;
        if (!user) {
          if (!cancelled) setState({ loading: false, error: "You are not signed in." });
          return;
        }

        const uid = user.id;
        const email = user.email ?? null;

        // 2) check admin status
        // This assumes a table `auth_admins(user_id uuid primary key)` exists.
        const { data: row, error: qErr } = await supabase
          .from("auth_admins")
          .select("user_id")
          .eq("user_id", uid)
          .maybeSingle();

        if (qErr && qErr.code !== "PGRST116") {
          // PGRST116 = no rows; not an error for maybeSingle
          throw qErr;
        }

        const isAdmin = !!row;

        if (!cancelled) {
          setState({ loading: false, userId: uid, email, isAdmin });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e?.message || String(e),
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // UI

  if (state.loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Admin Check</h1>
        <p className="mt-2 text-sm text-gray-500">Checking your admin status…</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Admin Check</h1>
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        <div className="text-sm">
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const email = state.email ?? "(unknown email)";
  const userId = state.userId ?? "(unknown id)";
  const isAdmin = !!state.isAdmin;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Check</h1>

      <div className="rounded border bg-white p-4">
        <div className="text-sm">Email: {email}</div>
        <div className="text-sm">User ID: {userId}</div>
        <div className="mt-2 text-base">
          {isAdmin ? (
            <span className="inline-flex items-center gap-2 text-emerald-700">
              You’re an admin <span>✅</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-rose-700">
              You are not an admin <span>⛔</span>
            </span>
          )}
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/instructors"
            className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Go to Instructors Admin
          </Link>
          <Link
            href="/admin/reviews"
            className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Go to Reviews Admin
          </Link>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          If you think this is a mistake, ask an existing admin to add your <code>user_id</code> to{" "}
          <code>auth_admins</code>.
        </div>
      )}
    </div>
  );
}
