import type { ButtonHTMLAttributes } from "react";

/**
 * Primitivo provisorio: sin tokens de paleta todavía (ver DESIGN.md, slice 0.6).
 * Restylear cuando se definan los tokens de color/forma.
 */
export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-11 rounded-lg bg-foreground px-4 font-medium text-background transition-opacity disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
