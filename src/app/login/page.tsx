"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mode = "password" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password"); // default to password for fast re-login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const clearStatus = () => { setMsg(null); setErr(null); };

  const loginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else window.location.href = "/admin/check";
  };

  const loginWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Option B callback flow we set up
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=/admin/check`
            : undefined,
      },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setMsg("Check your email for the login link.");
  };

  return (
    <div className="p-6 max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Login</h1>

      {/* Mode switcher */}
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => { setMode("password"); clearStatus(); }}
          className={`rounded-md border px-3 py-1 ${mode === "password" ? "bg-gray-100" : "hover:bg-gray-50"}`}
        >
          Email + Password
        </button>
        <button
          onClick={() => { setMode("magic"); clearStatus(); }}
          className={`rounded-md border px-3 py-1 ${mode === "magic" ? "bg-gray-100" : "hover:bg-gray-50"}`}
        >
          Magic Link
        </button>
      </div>

      {/* Shared email field */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full rounded-md border px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {mode === "password" ? (
        <form onSubmit={loginWithPassword} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={loginWithMagicLink} className="space-y-3">
          <button
            type="submit"
            disabled={busy || !email}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      {msg && <div className="text-green-700">{msg}</div>}
      {err && <div className="text-red-600">{err}</div>}

      <div className="text-xs text-gray-500">
        Tip: If you’re testing a lot, use Email+Password for faster re-login. Magic link is great for staying
        signed in long-term (don’t press Logout).
      </div>
    </div>
  );
}
