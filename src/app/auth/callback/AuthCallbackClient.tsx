"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [msg, setMsg] = useState("Finishing sign-in…");
  const [mode, setMode] = useState<"signing-in" | "recovery">("signing-in");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const url = window.location.href;

        const isReset = sp.get("reset") === "true";
        const code = sp.get("code");

        // Exchange code for session if present
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }

        if (isReset) {
          // Stay on page and show password reset form
          setMode("recovery");
          setMsg("Reset your password");
          return;
        }

        setMsg("Signed in! Redirecting…");
        window.postMessage({ type: "signed-in" }, window.location.origin);
        router.replace("/");
      } catch (e: any) {
        setMsg(`Sign-in failed: ${e?.message || String(e)}`);
      }
    })();
  }, [router, sp]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (!newPw || newPw.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message ?? "Could not set password.");
      setBusy(false);
    }
  }

  if (mode === "recovery") {
    return (
      <div className="p-6 space-y-4 max-w-md mx-auto">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        {err && <div className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-700">{err}</div>}
        <form onSubmit={handleSetPassword} className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">New password</div>
            <input
              type="password"
              className="w-full rounded border px-3 py-2"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button
            disabled={busy}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Auth</h1>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
