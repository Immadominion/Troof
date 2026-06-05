import { cn } from "@/lib/utils";

type Chip = { label: string; angle: number; ring?: 0 | 1 };

const RINGS = [
  { rx: 49, ry: 34 }, // outer
  { rx: 35, ry: 24 }, // mid
  { rx: 22, ry: 15 }, // inner
];

/**
 * Concentric elliptical orbit rings (the Oracle signature motif) with a center mark and
 * small labeled chips riding the rings. Rings drift slowly (motion-safe); chips stay upright.
 * Decorative: aria-hidden on the rings, the real trust copy lives as sibling DOM.
 */
export function OrbitCluster({
  center,
  chips,
  className,
}: {
  center: React.ReactNode;
  chips: Chip[];
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-md", className)}>
      {/* rings (slow rotation, motion-safe) */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="absolute inset-0 h-full w-full motion-safe:animate-[orbit-spin_90s_linear_infinite] motion-safe:[transform-origin:50%_50%]"
      >
        {RINGS.map((r, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="50"
            rx={r.rx}
            ry={r.ry}
            fill="none"
            className="stroke-brand-ring"
            strokeWidth="0.35"
          />
        ))}
      </svg>

      {/* center mark */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        {center}
      </div>

      {/* chips on the rings */}
      {chips.map((c) => {
        const r = RINGS[c.ring ?? 0];
        const rad = (c.angle * Math.PI) / 180;
        const left = 50 + r.rx * Math.cos(rad);
        const top = 50 - r.ry * Math.sin(rad);
        return (
          <div
            key={c.label}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-brand-ring bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm shadow-foreground/[0.04]">
              {c.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
