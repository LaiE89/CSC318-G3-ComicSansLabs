"use client";

import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const BLUE = "#568DED";
const CHART_H = 200;
const MIN_FRAC = 0.04;
const EDGE_FRAC = 0.12;

export type Segment = { id: string; start: number; end: number };

export const DEFAULT_AVAILABILITY: Segment[][] = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];

const TIME_LABELS = ["7am", "11am", "3pm", "7pm", "11pm"] as const;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeY(e: PointerEvent, track: HTMLElement) {
  const rect = track.getBoundingClientRect();
  const y = (e.clientY - rect.top) / rect.height;
  return clamp(y, 0, 1);
}

function segmentsHaveOverlap(segments: Segment[]): boolean {
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i];
      const b = segments[j];
      // Touching edges is allowed (end === other.start).
      if (a.start < b.end && a.end > b.start) return true;
    }
  }
  return false;
}

export function AvailabilityEditor({
  value,
  onChange,
}: {
  value: Segment[][];
  onChange: (next: Segment[][]) => void;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const [createPreview, setCreatePreview] = useState<{
    dayIndex: number;
    top: number;
    height: number;
  } | null>(null);

  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  const applyDay = useCallback((dayIndex: number, segments: Segment[]) => {
    if (segmentsHaveOverlap(segments)) return;
    onChange(valueRef.current.map((d, i) => (i === dayIndex ? segments : d)));
  }, [onChange]);

  const updateSegment = useCallback(
    (dayIndex: number, id: string, patch: Partial<Segment>) => {
      const next = valueRef.current.map((day, i) => {
        if (i !== dayIndex) return day;
        return day.map((s) => (s.id === id ? { ...s, ...patch } : s));
      });

      const nextDay = next[dayIndex];
      if (segmentsHaveOverlap(nextDay)) return;

      onChange(next);
    },
    [onChange],
  );

  const removeSegment = useCallback(
    (dayIndex: number, id: string) => {
      applyDay(
        dayIndex,
        valueRef.current[dayIndex].filter((s) => s.id !== id),
      );
    },
    [applyDay],
  );

  const onTrackPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    dayIndex: number,
  ) => {
    if (e.target !== e.currentTarget) return;
    const track = e.currentTarget;
    const y0 = normalizeY(e.nativeEvent, track);
    track.setPointerCapture(e.pointerId);

    setCreatePreview({
      dayIndex,
      top: y0 * 100,
      height: 0,
    });

    const onMove = (ev: PointerEvent) => {
      const y = normalizeY(ev, track);
      const a = Math.min(y0, y);
      const b = Math.max(y0, y);
      setCreatePreview({
        dayIndex,
        top: a * 100,
        height: (b - a) * 100,
      });
    };

    const onUp = (ev: PointerEvent) => {
      const y = normalizeY(ev, track);
      const a = Math.min(y0, y);
      const b = Math.max(y0, y);
      if (b - a >= MIN_FRAC) {
        const seg: Segment = { id: newId(), start: a, end: b };
        applyDay(dayIndex, [...valueRef.current[dayIndex], seg]);
      }
      setCreatePreview(null);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      try {
        track.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    };

    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
  };

  const onSegmentPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    dayIndex: number,
    seg: Segment,
  ) => {
    e.stopPropagation();
    const track = trackRefs.current[dayIndex];
    if (!track) return;
    track.setPointerCapture(e.pointerId);

    const rect = track.getBoundingClientRect();
    const segTop = rect.top + seg.start * rect.height;
    const segH = Math.max((seg.end - seg.start) * rect.height, 1);
    const rel = (e.clientY - segTop) / segH;

    type Mode = "move" | "resizeTop" | "resizeBottom";
    let mode: Mode;
    if (rel < EDGE_FRAC) mode = "resizeTop";
    else if (rel > 1 - EDGE_FRAC) mode = "resizeBottom";
    else mode = "move";

    const y0 = normalizeY(e.nativeEvent, track);
    let lastY = y0;

    const onMove = (ev: PointerEvent) => {
      const y = normalizeY(ev, track);
      const day = valueRef.current[dayIndex];
      const cur = day.find((s) => s.id === seg.id);
      if (!cur) return;

      if (mode === "move") {
        const delta = y - lastY;
        lastY = y;
        let ns = cur.start + delta;
        let ne = cur.end + delta;
        const len = ne - ns;
        if (ns < 0) {
          ns = 0;
          ne = len;
        }
        if (ne > 1) {
          ne = 1;
          ns = 1 - len;
        }
        if (ne - ns < MIN_FRAC) return;
        updateSegment(dayIndex, seg.id, { start: ns, end: ne });
        return;
      }

      if (mode === "resizeTop") {
        const ns = clamp(y, 0, cur.end - MIN_FRAC);
        updateSegment(dayIndex, seg.id, { start: ns });
        return;
      }

      const ne = clamp(y, cur.start + MIN_FRAC, 1);
      updateSegment(dayIndex, seg.id, { end: ne });
    };

    const onUp = (ev: PointerEvent) => {
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
      try {
        track.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    };

    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
  };

  const onSegmentDoubleClick = (
    e: React.MouseEvent,
    dayIndex: number,
    id: string,
  ) => {
    e.stopPropagation();
    removeSegment(dayIndex, id);
  };

  return (
    <div className="w-full select-none">
      <div className="flex gap-2">
        <div
          className="flex w-9 shrink-0 flex-col justify-between text-[10px] font-medium leading-none text-neutral-500"
          style={{ height: CHART_H }}
        >
          {TIME_LABELS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 gap-1.5">
          {value.map((segments, dayIdx) => (
            <div
              key={dayIdx}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div
                ref={(el) => {
                  trackRefs.current[dayIdx] = el;
                }}
                className="relative w-full max-w-[40px] cursor-crosshair touch-none rounded-full bg-neutral-200"
                style={{ height: CHART_H }}
                onPointerDown={(e) => onTrackPointerDown(e, dayIdx)}
              >
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    role="presentation"
                    className="absolute left-0.5 right-0.5 cursor-grab rounded-full active:cursor-grabbing"
                    style={{
                      top: `${seg.start * 100}%`,
                      height: `${(seg.end - seg.start) * 100}%`,
                      backgroundColor: BLUE,
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => onSegmentPointerDown(e, dayIdx, seg)}
                    onDoubleClick={(e) => onSegmentDoubleClick(e, dayIdx, seg.id)}
                  >
                    <button
                      type="button"
                      aria-label="Remove this availability block"
                      className="absolute -right-1 -top-1 z-10 flex size-3 touch-manipulation items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-black/10 transition hover:text-neutral-900 active:scale-95"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSegment(dayIdx, seg.id);
                      }}
                    >
                      <X className="size-2" strokeWidth={2.5} aria-hidden />
                    </button>
                  </div>
                ))}
                {createPreview &&
                  createPreview.dayIndex === dayIdx &&
                  createPreview.height > 0.1 && (
                    <div
                      className="pointer-events-none absolute left-0.5 right-0.5 rounded-full bg-white/50 ring-1 ring-white/90"
                      style={{
                        top: `${createPreview.top}%`,
                        height: `${createPreview.height}%`,
                      }}
                    />
                  )}
              </div>
              <span className="text-[10px] font-semibold text-neutral-500">
                {DAY_LABELS[dayIdx]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
