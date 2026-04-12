import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
      secondary: "bg-transparent border border-accent text-accent hover:bg-accent/10 shadow-lg shadow-accent/5",
      danger: "bg-transparent border border-destructive text-destructive hover:bg-destructive/10",
      ghost: "bg-transparent text-foreground hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-md",
      md: "px-6 py-2.5 rounded-lg",
      lg: "px-8 py-3.5 text-lg rounded-xl",
      icon: "p-2 rounded-lg flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={cn(
          "relative flex items-center justify-center transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          variants[variant],
          sizes[size],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        <span className={cn(isLoading && "opacity-0")}>{children as React.ReactNode}</span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
