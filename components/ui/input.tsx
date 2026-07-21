import type { InputHTMLAttributes } from "react";

export function Input({
  id,
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        className={`h-11 rounded-xl border border-border bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
        {...props}
      />
    </div>
  );
}
