// FILE: src/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NavAuth from "@/components/NavAuth"; // 👈 handles Login vs Admin+Logout
import "./globals.css";

export const metadata: Metadata = {
  title: "Yoga Reviews",
  description: "LA Fitness yoga instructor reviews",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl flex items-center justify-between p-4 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-semibold">
                Yoga Reviews
              </Link>
              <Link href="/instructors" className="hover:underline">
                Instructors
              </Link>
               <Link href="/admin/check" className="hover:underline">
                Admin
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </div>
            <NavAuth />
          </nav>
        </header>

        <main className="mx-auto max-w-5xl p-4">{children}</main>

        <footer className="mx-auto max-w-5xl p-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Yoga Reviews
        </footer>
      </body>
    </html>
  );
}
