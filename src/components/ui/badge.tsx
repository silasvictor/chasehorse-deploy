"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error";
}

const badgeVariants = {
  default: "border-border-grey bg-surface-muted text-slate-text",
  secondary: "border-border-grey bg-surface-muted text-foreground",
  success: "border-green-200 bg-green-50 text-success-teal",
  warning: "border-amber-200 bg-amber-50 text-warning-amber",
  error: "border-red-200 bg-red-50 text-error-red",
};

const Badge = React.forwardRef<
  HTMLSpanElement,
  BadgeProps
>(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      badgeVariants[variant],
      className,
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
