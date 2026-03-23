import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed select-none";

    const variants = {
      // Terracotta — primary brand action
      primary:
        "bg-brand text-white hover:bg-brand-dark active:scale-[0.98] shadow-sm",
      // Rich dark — strong secondary action (e.g. on dark backgrounds)
      secondary:
        "bg-ink text-white hover:bg-ink-mid active:scale-[0.98] shadow-sm",
      // Warm outline — subtle, tertiary action
      outline:
        "border border-warm-border text-ink bg-warm-white hover:border-ink hover:bg-cream active:scale-[0.98]",
      // Ghost — minimal, in-context action
      ghost:
        "text-pebble hover:text-ink hover:bg-brand-xlight active:scale-[0.98]",
      // Danger
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-sm",
    };

    const sizes = {
      sm:  "px-3.5 py-1.5 text-sm gap-1.5",
      md:  "px-5 py-2.5 text-sm gap-2",
      lg:  "px-7 py-3.5 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
