import { cn } from "@/lib/utils";

/** A 4-point sparkle accent (currentColor). Used sparingly as a brand-blue flourish. */
export function Sparkle({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? 12 : size === "lg" ? 28 : 18;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {/* concave 4-point star */}
      <path d="M12 0c.7 6.3 5.7 11.3 12 12-6.3.7-11.3 5.7-12 12-.7-6.3-5.7-11.3-12-12C6.3 11.3 11.3 6.3 12 0Z" />
    </svg>
  );
}
