// FILE: src/app/login/page.tsx
"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mode = "password" | "magic";
type PwView = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [pwView, setPwView] = useState<PwView>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }, []);

  const emailRedirectTo = `${origin}/auth/callback`;

  function resetAlerts() {
    setMsg(null);
    setErr(null);
  }

  async function onMagic(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      setMsg("Check your email for a magic link.");
    } catch (e: any) {
      setErr(e?.message ?? "Magic link failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    setBusy(true);
    try {
      if (pwView === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg("Signed in.");
        // optional: window.location.href = "/";
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        // If email confirmation is required, user must confirm in mailbox.
        setMsg("Account created. Check your email to confirm.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Password auth failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    resetAlerts();
    if (!email) {
      setErr("Enter your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${emailRedirectTo}?reset=true`,
      });
      if (error) throw error;
      setMsg("Password reset email sent.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4 bg-white rounded border">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      {/* Toggle: Password vs Magic link */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("password")}
          className={`px-3 py-1 rounded ${mode === "password" ? "bg-black text-white" : "border"}`}
          type="button"
        >
          Email & password
        </button>
        <button
          onClick={() => setMode("magic")}
          className={`px-3 py-1 rounded ${mode === "magic" ? "bg-black text-white" : "border"}`}
          type="button"
        >
          Magic link
        </button>
      </div>

      {/* Alerts */}
      {msg && <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">{msg}</div>}
      {err && <div className="rounded border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}

      {/* Forms */}
      {mode === "password" ? (
        <form onSubmit={onPassword} className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Email</div>
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Password</div>
            <input
              type="password"
              className="w-full rounded border px-3 py-2"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={pwView === "signin" || pwView === "signup"}
              autoComplete={pwView === "signin" ? "current-password" : "new-password"}
            />
          </label>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setPwView(pwView === "signin" ? "signup" : "signin")}
                className="underline"
              >
                {pwView === "signin" ? "Create account" : "Have an account? Sign in"}
              </button>
              <button type="button" onClick={onForgotPassword} className="underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? (pwView === "signin" ? "Signing in…" : "Creating…") : pwView === "signin" ? "Sign in" : "Create"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={onMagic} className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Email</div>
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      <p className="text-xs text-gray-500">
        Redirect URL: <code>{emailRedirectTo}</code>
      </p>
    </main>
  );
}
