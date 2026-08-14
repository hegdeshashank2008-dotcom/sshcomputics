import { useEffect, useRef, useState } from "react";
import { RotateCcw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const FACES = [
  { label: "Core idea", transform: "translateZ(90px)" },
  { label: "Structure", transform: "rotateY(180deg) translateZ(90px)" },
  { label: "Inputs", transform: "rotateY(-90deg) translateZ(90px)" },
  { label: "Outputs", transform: "rotateY(90deg) translateZ(90px)" },
  { label: "Formula", transform: "rotateX(90deg) translateZ(90px)" },
  { label: "Example", transform: "rotateX(-90deg) translateZ(90px)" },
] as const;

/**
 * Drag-to-rotate 360° 3D diagram of the current topic.
 * Pure CSS 3D transforms — works on desktop and touch.
 */
export function Rotatable3D({ topic, points }: { topic: string; points?: string[] }) {
  const [angle, setAngle] = useState({ x: -18, y: 24 });
  const [spin, setSpin] = useState(true);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!spin) return;
    let raf = 0;
    const tick = () => {
      setAngle((a) => ({ ...a, y: a.y + 0.25 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    setSpin(false);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setAngle((a) => ({
      x: Math.max(-85, Math.min(85, a.x - dy * 0.4)),
      y: a.y + dx * 0.4,
    }));
  };
  const onUp = () => {
    drag.current = null;
  };

  const labels = points && points.length ? points : FACES.map((f) => f.label);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Interactive 3D diagram</h3>
          <p className="text-sm text-muted-foreground">
            Drag to rotate {topic ? `“${topic}”` : "the model"} a full 360°.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSpin((s) => !s)} className="gap-1.5">
            {spin ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {spin ? "Pause" : "Spin"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAngle({ x: -18, y: 24 })}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div
        role="img"
        aria-label={`Rotatable 3D diagram of ${topic || "the topic"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="mt-6 flex h-[320px] cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
        style={{ perspective: "900px" }}
      >
        <div
          className="relative h-[180px] w-[180px]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg)`,
          }}
        >
          {FACES.map((face, i) => (
            <div
              key={face.label}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-primary/40 bg-primary/10 p-3 text-center backdrop-blur-sm"
              style={{ transform: face.transform }}
            >
              <span className="text-[0.65rem] uppercase tracking-widest text-primary">
                {face.label}
              </span>
              <span className="text-xs text-foreground/90">{labels[i] ?? topic}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
