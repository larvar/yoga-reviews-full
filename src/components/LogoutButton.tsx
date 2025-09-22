// src/components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    setMsg(null);
    setBusy(true);
    try {
      console.log("[Logout] click");
      // Quick proof the button is wired:
      // alert("Logout clicked"); // uncomment if you want a modal

      // See current session (for debugging)
      const { data: before } = await supabase.auth.getSession();
      console.log("[Logout] session BEFORE:", before?.session ? "present" : "none");

      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        console.error("[Logout] signOut error:", error.message);
        setMsg(error.message);
        return;
      }

      const { data: after } = await supabase.auth.getSession();
      console.log("[Logout] session AFTER:", after?.session ? "present" : "none");

      setMsg("Signed out. Redirecting…");
      // Hard reload to clear any lingering client caches/service workers
      window.location.href = "/?signed_out=1&t=" + Date.now();
    } catch (e: any) {
      console.error("[Logout] unexpected:", e?.message || e);
      setMsg(e?.message || "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLogout}
        disabled={busy}
        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
      >
        {busy ? "Logging out…" : "Logout"}
      </button>
      {msg && <span className="text-xs text-gray-600">({msg})</span>}
    </div>
  );
}
