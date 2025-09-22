// FILE: src/app/instructors/[slug]/metadata.ts
import type { Metadata } from "next";

// Minimal server-side SEO using slug in title.
// (For richer OG tags, wire a server Supabase client and pull display_name/photo_url.)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug?.replace(/-/g, " ") || "Instructor";
  return {
    title: `${title} – Yoga Reviews`,
    description: `Yoga instructor ${title} – bio, photos, and reviews.`,
    openGraph: {
      title: `${title} – Yoga Reviews`,
      description: `Yoga instructor ${title} – bio, photos, and reviews.`,
      type: "profile",
      url: `/instructors/${params.slug}`,
    },
  };
}
