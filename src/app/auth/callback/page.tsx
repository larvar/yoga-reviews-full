"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Step = { label: string; detail?: string };

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [steps, setSteps] = useState<Step[]>([
    { label: "Starting callback…" },
    { label: `URL`, detail: typeof window !== "undefined" ? window.location.href : "" },
  ]);
  const push = (s: Step) => setSteps((p) => [...p, s]);

  useEffect(() => {
    (async () => {
      try {
        const href = window.location.href;
        const hasCode = !!params.get("code");
        const hasHash = !!window.location.hash; // access_token flow

        push({ label: `detectSessionInUrl`, detail: String((supabase as any)._shared?.settings?.auth?.detectSessionInUrl) });
        push({ label: hasCode ? "Found ?code param" : "No ?code param" });
        push({ label: hasHash ? "Found #hash fragment" : "No #hash fragment" });

        if (hasCode) {
          push({ label: "Exchanging code for session…" });
          const { data, error } = await supabase.auth.exchangeCodeForSession(href);
          if (error) {
            push({ label: "exchangeCodeForSession error", detail: error.message });
            return;
          }
          push({ label: "exchangeCodeForSession OK", detail: JSON.stringify(Boolean(data.session)) });
        } else {
          // Hash-token flow is auto-handled when detectSessionInUrl: true.
          push({ label: "Touching getSession()…" });
          const { data } = await supabase.auth.getSession();
          push({ label: "getSession AFTER", detail: JSON.stringify(Boolean(data.session)) });
        }

        const after = await supabase.auth.getSession();
        push({ label: "Final session?", detail: JSON.stringify(Boolean(after.data.session)) });

        if (after.data.session) {
          // Try to notify the opener and then redirect this tab too
          try {
            window.opener?.postMessage({ type: "signed-in", next }, window.location.origin);
          } catch {}
          push({ label: "Redirecting to next", detail: next });
          router.replace(next);
        } else {
          push({ label: "No session after callback", detail: "Check Site URL/redirect settings & origins" });
        }
      } catch (e: any) {
        push({ label: "Unexpected error", detail: e?.message || String(e) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Finishing sign-in…</h1>
      <ol className="text-sm space-y-1">
        {steps.map((s, i) => (
          <li key={i}>
            <b>{i + 1}.</b> {s.label} {s.detail ? <span className="text-gray-600 break-all">— {s.detail}</span> : null}
          </li>
        ))}
      </ol>
      <p className="text-xs text-gray-500">Leave this tab open and copy any error line to me if it doesn’t redirect.</p>
    </div>
  );
}
