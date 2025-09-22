// FILE: src/components/Lightbox.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type Img = { url: string; caption?: string };

export default function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: {
  images: Img[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef<{ d: number; zoom: number } | null>(null);

  // ---- helpers (make structural, not DOM Touch-specific)
  function dist(
    a: { clientX: number; clientY: number },
    b: { clientX: number; clientY: number }
  ) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  // ---- keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
    resetView();
  }
  function next() {
    setIndex((i) => (i + 1) % images.length);
    resetView();
  }
  function resetView() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    dragRef.current = null;
    touchRef.current = null;
  }

  // ---- mouse drag to pan (when zoomed)
  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setOffset({
      x: e.clientX - dragRef.current.x,
      y: e.clientY - dragRef.current.y,
    });
  }
  function onMouseUp() {
    dragRef.current = null;
  }

  // ---- wheel to zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const z = clamp(zoom + (e.deltaY > 0 ? -0.1 : 0.1), 1, 4);
    setZoom(z);
  }

  // ---- touch pinch zoom
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]); // React.Touch has clientX/Y
      touchRef.current = { d, zoom };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && touchRef.current) {
      const nd = dist(e.touches[0], e.touches[1]);
      const factor = nd / touchRef.current.d;
      setZoom(clamp(touchRef.current.zoom * factor, 1, 4));
    }
  }
  function onTouchEnd() {
    touchRef.current = null;
  }

  const img = images[index];

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 text-white"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3">
        <div className="text-sm opacity-80">
          {index + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
            onClick={resetView}
          >
            Reset
          </button>
          <button
            className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.caption ?? ""}
          className="max-h-[80vh] max-w-[90vw] cursor-grab"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      </div>

      {/* Caption + nav */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 px-4 py-3">
        <button
          className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          onClick={prev}
          aria-label="Previous"
        >
          ← Prev
        </button>
        <div className="min-h-[1.5rem] max-w-[70%] truncate text-center text-sm opacity-90">
          {img.caption ?? ""}
        </div>
        <button
          className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          onClick={next}
          aria-label="Next"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
