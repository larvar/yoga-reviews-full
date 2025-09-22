// FILE: src/app/auth/callback/page.tsx
import AuthCallbackClient from "./AuthCallbackClient";

export const dynamic = "force-dynamic"; // avoid static prerender

export default function AuthCallbackPage() {
  // No Suspense needed now because we won't use useSearchParams()
  return <AuthCallbackClient />;
}
