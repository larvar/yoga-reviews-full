// File: src/app/instructor/claim/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClaimInstructorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const id = params.get("id");
  const token = params.get("t");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!id || !token) {
          setStatus("error");
          setMessage("Missing claim parameters.");
          return;
        }
        setStatus("working");
        setMessage("Checking authentication…");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/login?next=/instructor/claim?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`);
          return;
        }

        setMessage("Claiming your instructor page…");
        const { error } = await supabase.rpc("claim_instructor", { i_id: id, secret: token });
        if (error) throw error;

        setStatus("done");
        setMessage("Success! This page is now linked to your account.");
        setTimeout(() => router.replace("/instructor/me"), 800);
      } catch (e: any) {
        if (!active) return;
        setStatus("error");
        setMessage(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [id, token, router]);

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Claim Instructor Page</h1>
      <div className="mt-4 rounded-xl border p-4">
        {status === "idle" && <p>Preparing…</p>}
        {status === "working" && <p>{message}</p>}
        {status === "done" && <p className="text-green-700">{message} Redirecting…</p>}
        {status === "error" && <p className="text-red-700">{message || "Something went wrong."}</p>}
      </div>
    </main>
  );
}
