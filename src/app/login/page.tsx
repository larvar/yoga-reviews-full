// FILE: src/app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || ""; // optional fallback

    const emailRedirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4 bg-white rounded border">
      <h1 className="text-xl font-semibold">Log in</h1>

      {sent ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
          Check your email for a magic link. Open it on this device and you’ll be signed in.
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border px-3 py-2"
              placeholder="you@example.com"
            />
          </label>

          {err && (
            <div className="rounded border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Send magic link
          </button>
        </form>
      )}
    </div>
  );
}
