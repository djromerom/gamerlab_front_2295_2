import * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  boxClassName?: string;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, boxClassName, ...props }, ref) => {
    // Use a hidden native checkbox as the input (for accessibility) and a visual
    // span that shows a transparent background and a noticeable purple border
    // when checked. The checkmark SVG becomes visible in purple.
    return (
      <>
        <input
          ref={ref}
          type="checkbox"
          className={cn("sr-only peer", className)}
          {...props}
        />

        <span
          aria-hidden
          className={cn(
            "w-4 h-4 inline-flex items-center justify-center rounded border-2 border-border bg-transparent transition-colors peer-focus:ring-2 peer-focus:ring-ring text-transparent peer-checked:text-purple-600 peer-checked:border-purple-600",
            boxClassName
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 stroke-current transition-colors"
          >
            <path
              d="M5 12.5L9.5 17L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
