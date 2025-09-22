// FILE: src/app/instructor/me/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InstructorPhotosEditor from "@/components/InstructorPhotosEditor";

type InstructorRow = {
  id: string;
  display_name: string | null;
  slug: string | null;
  bio: string | null;
  photo_url: string | null;
  approved: boolean | null;
  visible: boolean | null;
};

export default function MyProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [row, setRow] = useState<InstructorRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Grab current user/auth
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);
      setEmail(u.user?.email ?? null);
      if (!uid) return;

      // Load instructor row for this user
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        setErr(error.message);
        return;
      }

      if (!data) {
        // No row yet; defaults for the editor
        setRow(null);
        setName("");
        setSlug("");
        setBio("");
        setCoverUrl(null);
      } else {
        setRow(data as InstructorRow);
        setName(data.display_name ?? "");
        setSlug(data.slug ?? "");
        setBio(data.bio ?? "");
        setCoverUrl(data.photo_url ?? null);
      }
    })();
  }, []);

  const slugCandidate = useMemo(() => {
    if (slug.trim()) return slug.trim().toLowerCase();
    const base = (name || email || "instructor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return base || "instructor";
  }, [name, slug, email]);

  async function saveProfile() {
    if (!userId) {
      setErr("You must be signed in.");
      return;
    }
    setErr(null);
    setSavedMsg(null);
    setBusy(true);

    try {
      if (!row) {
        // Create
        const insert = {
          user_id: userId,
          display_name: name || email || "Instructor",
          slug: slugCandidate,
          bio: bio || null,
          photo_url: coverUrl || null,
          visible: true,
          approved: false,
        };
        const { data, error } = await supabase
          .from("instructors")
          .insert(insert)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        setRow(data as InstructorRow);
        setSavedMsg("Profile created. Once approved, it will be public.");
      } else {
        // Update
        const update = {
          display_name: name || row.display_name || "Instructor",
          slug: slugCandidate,
          bio: bio || null,
          photo_url: coverUrl || null,
        };
        const { data, error } = await supabase
          .from("instructors")
          .update(update)
          .eq("id", row.id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        setRow(data as InstructorRow);
        setSavedMsg("Profile saved.");
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Profile</h1>

      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
      {savedMsg && <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{savedMsg}</div>}

      {/* Basic fields */}
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl || "/review-placeholder.jpg"}
            alt="Cover"
            className="w-28 h-28 rounded object-cover border"
            style={{ objectPosition: "center top" }}
          />
          <div>
            <div className="text-xs text-gray-500">Cover photo (set below in Photos)</div>
            <div className="text-xs text-gray-400">
              {row?.id ? <>Instructor ID: {row.id}</> : "No profile yet — click Save to create it."}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-sm">Display name</span>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm">Custom profile URL (slug)</span>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="jane-doe"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Your page will be at <code>/instructors/{slugCandidate || "your-slug"}</code>
          </div>
        </label>

        <label className="block">
          <span className="text-sm">Bio</span>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={5}
            placeholder="Tell visitors about your teaching style, certifications, etc."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={saveProfile}
          disabled={busy}
          className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "Saving…" : row ? "Save" : "Create profile"}
        </button>
      </div>

      {/* Photos */}
      {row?.id ? (
        <InstructorPhotosEditor
          instructorId={row.id}
          onCoverChange={(url) => setCoverUrl(url)}
        />
      ) : (
        <div className="rounded-lg border bg-white p-3 text-sm text-gray-500">
          Create your profile first, then you can add photos.
        </div>
      )}
    </div>
  );
}
