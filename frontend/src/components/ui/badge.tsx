import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-slate-950 text-white border-slate-950",
        variant === "secondary" && "bg-slate-100 text-slate-900 border-slate-200",
        className
      )}
      {...props}
    />
  );
}

