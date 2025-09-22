// FILE: src/components/NavAuth.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NavAuth() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setEmail(sess?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!email) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="hover:underline">Login</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/instructor/me" className="hover:underline">My Profile</Link>
      <Link href="/account/security" className="hover:underline">Security</Link>
      <button
        onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  );
}
