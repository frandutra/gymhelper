"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { createRoutineAction, type RoutineFormState } from "@/app/(app)/routines/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RoutineFormState = {};

export function CreateRoutineForm() {
  const t = useTranslations("routines");
  const [state, formAction, pending] = useActionState(createRoutineAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <Input id="new-routine-name" name="name" label={t("namePlaceholder")} required />
      <Input id="new-routine-notes" name="notes" label={t("notesPlaceholder")} />
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
