// FILE: src/app/auth/callback/AuthCallbackClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackClient() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finishing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const url = window.location.href;
        const u = new URL(url);
        const hasCode = u.searchParams.has("code");
        const hasTokensInHash =
          window.location.hash.includes("access_token") ||
          window.location.hash.includes("refresh_token");

        if (hasCode || hasTokensInHash) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }

        setMsg("Signed in! Redirecting…");

        // Notify opener/listener if present (used by NavAuth)
        try {
          window.postMessage({ type: "signed-in" }, window.location.origin);
        } catch {}

        router.replace("/");
      } catch (e: any) {
        setMsg(`Sign-in failed: ${e?.message || String(e)}`);
      }
    })();
  }, [router]);

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Auth</h1>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
