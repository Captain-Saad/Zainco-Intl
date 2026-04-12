import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "gold" | "blue" | "green" | "red" | "outline";
  className?: string;
}

export function Badge({ children, variant = "outline", className }: BadgeProps) {
  const variants = {
    gold: "bg-primary/15 text-primary border border-primary/30",
    blue: "bg-accent/15 text-accent border border-accent/30",
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    red: "bg-destructive/15 text-destructive border border-destructive/30",
    outline: "bg-transparent text-muted-foreground border border-border",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit", variants[variant], className)}>
      {children}
    </span>
  );
}
