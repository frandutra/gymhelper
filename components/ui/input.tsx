import type { InputHTMLAttributes } from "react";

/**
 * Primitivo provisorio: sin tokens de paleta todavía (ver DESIGN.md, slice 0.6).
 * Restylear cuando se definan los tokens de color/forma.
 */
export function Input({
  id,
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className={`h-11 rounded-lg border border-black/15 px-3 dark:border-white/15 ${className}`}
        {...props}
      />
    </div>
  );
}
