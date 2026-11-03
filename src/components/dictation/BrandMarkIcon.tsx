import React from "react";

interface BrandMarkIconProps {
  size?: number;
  className?: string;
}

/**
 * MyFlow wave brand mark. Draws in `currentColor` so it follows the
 * neutral foreground treatment of the surface that contains it.
 */
export function BrandMarkIcon({ size = 24, className }: BrandMarkIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12C4.5 12 5 8.5 6.5 8.5C8 8.5 8.5 15.5 12 15.5C15.5 15.5 16 8.5 17.5 8.5C19 8.5 19.5 12 21 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
