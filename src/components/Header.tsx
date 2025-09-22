// File: src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_UID = "bc8c011b-664e-4102-9994-e65bfea2f786";

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // check auth state once on mount
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId(null);
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <Link href="/" className="text-lg font-bold">
        Yoga Review
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/instructors" className="hover:underline">
          Instructors
        </Link>

        {!userId && (
          <Link href="/login" className="hover:underline">
            Login
          </Link>
        )}

        {userId && userId === ADMIN_UID && (
          <Link href="/admin/check" className="hover:underline">
            Admin
          </Link>
        )}

        {userId && (
          <>
            <Link href="/instructor/me" className="hover:underline">
              My Profile
            </Link>
            <button onClick={handleLogout} className="hover:underline">
              Log out
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
