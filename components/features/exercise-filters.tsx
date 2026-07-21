"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  bodyParts: readonly string[];
  equipmentOptions: string[];
};

export function ExerciseFilters({ bodyParts, equipmentOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("exercises");
  const tBodyParts = useTranslations("exercises.bodyParts");
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) {
        updateParams({ q: query });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <div className="flex gap-2">
        <select
          value={searchParams.get("bodyPart") ?? ""}
          onChange={(e) => updateParams({ bodyPart: e.target.value })}
          aria-label={t("bodyPartLabel")}
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">{t("bodyPartAll")}</option>
          {bodyParts.map((bp) => (
            <option key={bp} value={bp}>
              {tBodyParts(bp)}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("equipment") ?? ""}
          onChange={(e) => updateParams({ equipment: e.target.value })}
          aria-label={t("equipmentLabel")}
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-2 text-sm capitalize text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">{t("equipmentAll")}</option>
          {equipmentOptions.map((eq) => (
            <option key={eq} value={eq} className="capitalize">
              {eq}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
