// FILE: src/app/account/security/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // redirect to login if not signed in
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace("/login");
    })();
  }, [router]);

  async function updatePw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg("Password updated. Use it next time on the login page.");
      setPw("");
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Account Security</h1>
      {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{msg}</div>}
      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <form onSubmit={updatePw} className="rounded border bg-white p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={8}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <button disabled={busy} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </main>
  );
}
