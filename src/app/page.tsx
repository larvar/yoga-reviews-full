// FILE: src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AddReview from "@/components/AddReview"; // 👈 add the modal

type InstructorCard = {
  id: string;
  name: string | null;       // display_name alias
  slug: string | null;
  photo_url: string | null;
};

type ReviewRow = {
  id: string;
  created_at: string;
  title: string | null;
  comment: string | null;
  rating: number | null;
  image_url: string | null;
};

export default function HomePage() {
  const [instructors, setInstructors] = useState<InstructorCard[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [instErr, setInstErr] = useState<string | null>(null);
  const [revErr, setRevErr] = useState<string | null>(null);

  // 👇 controls the modal
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    // Featured instructors
    supabase
      .from("instructors")
      .select("id, name:display_name, slug, photo_url")
      .eq("approved", true)
      .eq("visible", true)
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) setInstErr(error.message);
        else setInstructors(data ?? []);
      });

    // Recent reviews (approved & not hidden)
    supabase
      .from("reviews")
      .select("id, created_at, title, comment, rating, image_url, hidden, status")
      .or("hidden.is.null,hidden.eq.false")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) setRevErr(error.message);
        else setReviews((data ?? []) as any);
      });
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "64vh",
          overflow: "hidden",
          backgroundImage: 'url("/hero.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0 }}>Find & review yoga instructors</h1>
          <p style={{ marginTop: 12, maxWidth: 720, fontSize: 18, opacity: 0.9 }}>
            Browse published profiles, then leave a review to help others.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/instructors"
              style={{
                background: "white",
                color: "black",
                padding: "12px 20px",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Browse Instructors
            </Link>
            <button
              onClick={() => setShowReview(true)} // 👈 open modal here
              style={{
                background: "transparent",
                color: "white",
                padding: "12px 20px",
                borderRadius: 12,
                border: "2px solid rgba(255,255,255,0.8)",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Leave a Review
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED INSTRUCTORS */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 16px",
          marginTop: "-80px",
          background: "white",
          borderRadius: 16,
          position: "relative",
          zIndex: 5,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Featured Instructors</h2>

        {instErr && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#7f1d1d",
            }}
          >
            {instErr}
          </div>
        )}

        {!instErr && (
          <>
            {!instructors.length ? (
              <p style={{ color: "#6b7280" }}>No published instructors yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 20,
                }}
              >
                {instructors.slice(0, 9).map((i) => (
                  <Link
                    key={i.id}
                    href={`/instructors/${i.slug ?? ""}`}
                    style={{
                      display: "block",
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      textDecoration: "none",
                      color: "inherit",
                      background: "white",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={i.photo_url || "/review-placeholder.jpg"}
                      alt={i.name || "Instructor"}
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: i.photo_url ? "cover" : "contain",
                        objectPosition: "center top",
                        background: i.photo_url ? undefined : "#fff",
                        padding: i.photo_url ? 0 : 8,
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        marginBottom: 12,
                      }}
                    />
                    <div style={{ fontWeight: 600 }}>{i.name || "(Unnamed instructor)"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{i.slug}</div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* RECENT REVIEWS */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Recent Reviews</h2>

        {revErr && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#7f1d1d",
            }}
          >
            {revErr}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {reviews.map((r) => {
            const src = r.image_url || "/review-placeholder.jpg";
            const isPlaceholder = !r.image_url;
            const rating = Math.max(0, Math.min(5, r.rating ?? 0));
            return (
              <Link
                key={r.id}
                href={`/reviews/${r.id}`}
                style={{
                  display: "block",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={r.title || "Review"}
                  style={{
                    width: "100%",
                    height: 96,
                    objectFit: isPlaceholder ? "contain" : "cover",
                    objectPosition: "center",
                    background: isPlaceholder ? "#fff" : undefined,
                    padding: isPlaceholder ? 8 : 0,
                    borderRadius: 10,
                    marginBottom: 10,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <div style={{ fontWeight: 600 }}>{r.title || "Review"}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleDateString()} {" · "}
                  {"★".repeat(rating)}
                  <span style={{ color: "#e5e7eb" }}>{"★".repeat(5 - rating)}</span>
                </div>
                <div style={{ color: "#374151", marginTop: 6, fontSize: 14, lineHeight: 1.35 }}>
                  {(r.comment || "").slice(0, 160)}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 👇 Mount the modal (no instructorId passed) */}
      <AddReview open={showReview} onClose={() => setShowReview(false)} />
    </main>
  );
}
