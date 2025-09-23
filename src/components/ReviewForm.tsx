'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  /** The instructor slug from the route, e.g. "test-instructor" */
  slug: string;
  /** Optional: called after a successful insert so the page can refresh data */
  onSubmitted?: () => void;
};

export default function ReviewForm({ slug, onSubmitted }: Props) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Basic validation
    const r = Number(rating);
    if (!slug) return setMsg({ type: 'error', text: 'Missing instructor slug.' });
    if (!r || r < 1 || r > 5) return setMsg({ type: 'error', text: 'Rating must be 1–5.' });

    setSubmitting(true);
    try {
      // 1) Look up the instructor UUID by slug
      const { data: instr, error: instrErr } = await supabase
        .from('instructors')
        .select('id')
        .eq('slug', slug)
        .single();

      if (instrErr || !instr?.id) {
        throw new Error(instrErr?.message || 'Instructor not found for slug: ' + slug);
      }

      // 2) Insert the review with the correct column name: instructor_id (uuid)
      const { error: insErr } = await supabase.from('reviews').insert({
        name: name || null,
        instructor_id: instr.id, // ✅ THIS IS THE FIX
        rating: r,
        comment: comment || null,
        location: location || null,
        // Optional fields your table supports; we let defaults handle approved/hidden/status
        // approved: false,
        // hidden: false,
        // status: 'pending',
      });

      if (insErr) throw insErr;

      setMsg({ type: 'success', text: 'Thanks! Your review was submitted and is pending approval.' });
      setName('');
      setRating('');
      setComment('');
      setLocation('');
      onSubmitted?.();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message ?? 'Submit failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 rounded-2xl border p-5 shadow-sm">
      <h3 className="text-xl font-semibold">Leave a Review</h3>

      {msg && (
        <div
          className={`rounded-md border p-3 text-sm ${
            msg.type === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Your name (optional)</span>
          <input
            className="rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane D."
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Location (optional)</span>
          <input
            className="rounded-lg border px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Irvine, CA • LA Fitness"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Rating (1–5)</span>
          <input
            type="number"
            min={1}
            max={5}
            className="rounded-lg border px-3 py-2"
            value={rating}
            onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">Comment</span>
          <textarea
            className="min-h-[100px] rounded-lg border px-3 py-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? Flow, music, cues, difficulty…"
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Submitting for instructor: <code>{slug}</code></span>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
