import { forwardRef, useState, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, type = "text", value, onChange, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = Boolean(value) || (props.defaultValue !== undefined && props.defaultValue !== "");

    return (
      <div className="relative w-full">
        <label
          htmlFor={id}
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none text-muted-foreground",
            (focused || hasValue) 
              ? "text-xs -top-2.5 bg-background px-1 text-primary z-10" 
              : "top-3.5 text-base"
          )}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
