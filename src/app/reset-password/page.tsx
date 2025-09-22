// File: src/app/reset-password/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setMsg("If that email exists, we sent a reset link.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="text-sm text-gray-600 mt-1">We’ll email you a password reset link.</p>

      <form onSubmit={handleReset} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}
    </main>
  );
}
