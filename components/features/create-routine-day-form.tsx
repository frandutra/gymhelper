"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { createDayAction, type RoutineDayFormState } from "@/app/(app)/routines/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RoutineDayFormState = {};

export function CreateRoutineDayForm({ routineId }: { routineId: string }) {
  const t = useTranslations("routines.days");
  const [state, formAction, pending] = useActionState(createDayAction, initialState);
  const weekdays = t.raw("weekdays") as string[];

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3"
    >
      <input type="hidden" name="routineId" value={routineId} />
      <Input id="new-day-name" name="name" label={t("namePlaceholder")} required />
      <div className="flex flex-col gap-1">
        <label htmlFor="new-day-weekday" className="text-sm font-medium text-foreground">
          {t("weekdayLabel")}
        </label>
        <select
          id="new-day-weekday"
          name="weekday"
          defaultValue=""
          className="h-11 rounded-xl border border-border bg-surface px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="">{t("weekdayNone")}</option>
          {weekdays.map((label, index) => (
            <option key={index} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
