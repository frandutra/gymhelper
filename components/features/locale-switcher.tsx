"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/i18n/request";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label={t("label")}
      value={locale}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Locale;
        startTransition(() => {
          setLocale(next);
        });
      }}
      className="h-11 rounded-xl border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
