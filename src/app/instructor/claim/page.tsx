// FILE: src/app/instructor/claim/page.tsx
import { Suspense } from "react";
import ClaimClient from "./ClaimClient";

export const dynamic = "force-dynamic"; // avoid static prerender with search params

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}>
      <ClaimClient />
    </Suspense>
  );
}
