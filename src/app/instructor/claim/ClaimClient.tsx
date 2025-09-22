// FILE: src/app/instructor/claim/ClaimClient.tsx  (Client Component)
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabaseClient"; // uncomment if you use it here

export default function ClaimClient() {
  const sp = useSearchParams();
  const token = sp.get("token") || sp.get("t") || "";
  const [status, setStatus] = useState<"idle" | "ready" | "missing">("idle");

  useEffect(() => {
    setStatus(token ? "ready" : "missing");
  }, [token]);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Claim Instructor</h1>

      {status === "missing" && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No token found in the URL. Please open the link from your email.
        </div>
      )}

      {status === "ready" && (
        <div className="rounded border bg-white p-3 text-sm">
          Token detected. You can proceed with the claim flow here.
          {/* Your existing claim logic goes here (e.g., calling an RPC with `token`) */}
        </div>
      )}
    </div>
  );
}
