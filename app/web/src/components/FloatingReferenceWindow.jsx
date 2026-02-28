import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { loadPinnedReferences, removePinnedReference } from "@/lib/pinnedReferences";

export default function FloatingReferenceWindow({ onClose }) {
  const [pins, setPins] = useState([]);
  const [idx, setIdx] = useState(0);
  const [opacity, setOpacity] = useState(70);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const [size, setSize] = useState({ w: 260, h: 180 });
  const drag = useRef(null);

  useEffect(() => {
    const p = loadPinnedReferences();
    setPins(p);
    setIdx(0);
  }, []);

  const active = useMemo(() => pins[idx] ?? null, [pins, idx]);

  const startDrag = (e) => {
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: pos.x,
      baseY: pos.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onDrag = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setPos({ x: Math.max(0, drag.current.baseX + dx), y: Math.max(0, drag.current.baseY + dy) });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const unpinActive = () => {
    if (!active) return;
    const next = removePinnedReference(active.id);
    setPins(next);
    setIdx((i) => Math.min(i, Math.max(0, next.length - 1)));
  };

  const goPrev = () => setIdx((i) => (pins.length ? (i - 1 + pins.length) % pins.length : 0));
  const goNext = () => setIdx((i) => (pins.length ? (i + 1) % pins.length : 0));

  if (!pins.length) return null;

  return (
    <div
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div className="h-full rounded-xl border border-gray-800 bg-gray-950/80 backdrop-blur shadow-2xl overflow-hidden">
        <div
          className="flex items-center justify-between px-2 py-2 border-b border-gray-800 cursor-move select-none"
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="text-gray-300 hover:bg-gray-800" onClick={goPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-gray-300 hover:bg-gray-800" onClick={goNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-300 truncate px-2">
            {active?.category ?? "Pinned"}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-300 hover:bg-gray-800"
              onClick={unpinActive}
              title="Unpin"
            >
              <PinOff className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-300 hover:bg-gray-800"
              onClick={onClose}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-[calc(100%-44px)]">
          <img
            src={active?.url}
            alt={active?.category ?? "Pinned"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: opacity / 100 }}
            draggable={false}
          />

          <div className="absolute left-2 right-2 bottom-2 rounded-lg bg-gray-950/70 border border-gray-800 p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300">Opacity</span>
              <span className="text-xs text-cyan-300">{opacity}%</span>
            </div>
            <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} min={20} max={100} step={1} />
          </div>

          <div
            className="absolute right-1 bottom-1 w-4 h-4 rounded bg-white/10 border border-gray-700 cursor-nwse-resize"
            onPointerDown={(e) => {
              e.stopPropagation();
              const start = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
              const move = (ev) => {
                const dw = ev.clientX - start.x;
                const dh = ev.clientY - start.y;
                setSize({ w: Math.max(200, start.w + dw), h: Math.max(140, start.h + dh) });
              };
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
            title="Resize"
          />
        </div>
      </div>
    </div>
  );
}

