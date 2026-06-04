import { cn } from "@/lib/utils";

/** Troof seal-mark: a hexagonal stamp with a check, "sealed & verified". Uses currentColor. */
export function TroofMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("h-5 w-5", className)}
    >
      <path
        d="M12 1.7 21 6.9v10.2L12 22.3 3 17.1V6.9L12 1.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        className="opacity-60"
      />
      <path
        d="M8.2 12.2 11 15l4.8-5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TroofWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="h-6 w-6" />
      <span className="font-mono text-[15px] font-medium tracking-tight lowercase">troof</span>
    </span>
  );
}
