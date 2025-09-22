// FILE: src/app/contact/page.tsx
"use client";

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Contact the Administrator</h1>

      <p className="text-lg">
        Have a question, found an issue, or want to get in touch?
      </p>

      <div className="rounded-md border bg-white p-4">
        <p>
          Please email me directly at{" "}
          <a
            href="mailto:LarsVarn@gmail.com"
            className="text-blue-600 underline"
          >
            LarsVarn@gmail.com
          </a>
        </p>
      </div>

      <p className="text-sm text-gray-500">
        I usually respond within 24 hours.
      </p>
    </main>
  );
}
