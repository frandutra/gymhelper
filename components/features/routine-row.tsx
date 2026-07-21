"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  archiveRoutineAction,
  renameRoutineAction,
  type RoutineFormState,
} from "@/app/(app)/routines/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoutineRow as RoutineRowType } from "@/lib/db/queries/routines";

const initialState: RoutineFormState = {};

export function RoutineRow({ routine }: { routine: RoutineRowType }) {
  const t = useTranslations("routines");
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(renameRoutineAction, initialState);

  useEffect(() => {
    if (!pending && state !== initialState && !state.error) {
      setEditing(false);
    }
  }, [state, pending]);

  if (editing) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3"
      >
        <input type="hidden" name="routineId" value={routine.id} />
        <Input
          id={`name-${routine.id}`}
          name="name"
          label={t("namePlaceholder")}
          defaultValue={routine.name}
          required
        />
        <Input
          id={`notes-${routine.id}`}
          name="notes"
          label={t("notesPlaceholder")}
          defaultValue={routine.notes ?? ""}
        />
        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3">
      <Link href={`/routines/${routine.id}`} className="flex-1">
        <p className="font-medium underline">{routine.name}</p>
        {routine.notes && <p className="text-sm text-muted">{routine.notes}</p>}
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-accent underline"
        >
          {t("rename")}
        </button>
        <form action={archiveRoutineAction}>
          <input type="hidden" name="routineId" value={routine.id} />
          <button type="submit" className="text-sm font-medium text-muted underline">
            {t("archive")}
          </button>
        </form>
      </div>
    </div>
  );
}
