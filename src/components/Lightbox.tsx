// FILE: src/components/Lightbox.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LightboxImage = { url: string; alt?: string | null };

export default function Lightbox({
  images,
  index,
  onClose,
  onChange,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onChange: (nextIndex: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ d: number; zoom: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const current = images[index];

  const thumbStrip = useMemo(() => images.slice(0, 12), [images]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
      if (e.key === "+") setZoom(z => Math.min(4, z + 0.25));
      if (e.key === "-") setZoom(z => Math.max(1, z - 0.25));
      if (e.key === "0") { setZoom(1); setOffset({ x: 0, y: 0 }); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onChange]);

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom(z => {
      const next = e.deltaY < 0 ? Math.min(4, z + 0.1) : Math.max(1, z - 0.1);
      return Math.round(next * 100) / 100;
    });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (zoom === 1) return;
    startRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!startRef.current) return;
    setOffset({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y });
  }
  function onMouseUp() { startRef.current = null; }

  function dist(a: Touch, b: Touch) {
    const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      touchRef.current = { d, zoom };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const nd = dist(e.touches[0], e.touches[1]);
      const base = touchRef.current;
      const factor = nd / base.d;
      setZoom(Math.max(1, Math.min(4, Math.round((base.zoom * factor) * 100) / 100)));
    }
  }
  function onTouchEnd() { touchRef.current = null; }

  if (!current) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/90 flex flex-col"
      onClick={onBackdropClick}
      aria-modal
      role="dialog"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 text-white/90">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => onChange((index - 1 + images.length) % images.length)} className="border border-white/30 rounded px-2 py-1">←</button>
          <button onClick={() => onChange((index + 1) % images.length)} className="border border-white/30 rounded px-2 py-1">→</button>
          <span className="ml-2">{index + 1} / {images.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="border border-white/30 rounded px-2 py-1">-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="border border-white/30 rounded px-2 py-1">+</button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="border border-white/30 rounded px-2 py-1">Reset</button>
          <button onClick={onClose} className="border border-white/30 rounded px-3 py-1">✕</button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt || ""}
          className="object-contain select-none"
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            maxHeight: "85vh",
            maxWidth: "90vw",
          }}
        />
      </div>

      {/* Thumbs */}
      <div className="flex gap-2 overflow-auto p-2 bg-black/80">
        {thumbStrip.map((t, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={t.url}
            alt={t.alt || ""}
            onClick={() => onChange(i)}
            className={`h-14 w-auto object-cover rounded cursor-pointer ${i===index ? "ring-2 ring-white" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
