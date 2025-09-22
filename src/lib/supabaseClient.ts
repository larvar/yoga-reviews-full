// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,        // ✅ keep session in localStorage
      autoRefreshToken: true,      // ✅ refresh before expiry
      detectSessionInUrl: true,    // ✅ handle magic-link callback
      storageKey: "yoga-review-auth", // (optional) explicit key
    },
  }
);
