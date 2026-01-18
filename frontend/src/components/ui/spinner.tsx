import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950",
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}

