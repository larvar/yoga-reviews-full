Yoga Review Patch Bundle

Files in this zip are meant to be merged into your repo. Place `src/*` under your project's `src/`,
and `public/*` under your project's `public/`.

Key routes:
- /instructor/me (self-serve editor)
- /instructor/claim (claim page)
- /instructors (index grid)
- /instructors/[slug] (public profile)
- /login, /reset-password, /update-password (auth)

Make sure .env.local has:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

And in Supabase: Authentication → URL Configuration → Site URL = http://localhost:3000 (for local dev).
