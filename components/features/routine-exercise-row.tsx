"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import {
  moveRoutineExerciseAction,
  removeRoutineExerciseAction,
  updateRoutineExerciseAction,
  type RoutineExerciseFormState,
} from "@/app/(app)/routines/[id]/days/[dayId]/actions";
import { Button } from "@/components/ui/button";
import type { RoutineExerciseWithExercise } from "@/lib/db/queries/routine-exercises";
import { exerciseMediaUrl } from "@/lib/media";

const initialState: RoutineExerciseFormState = {};

export function RoutineExerciseRow({
  dayId,
  item,
  isFirst,
  isLast,
}: {
  dayId: string;
  item: RoutineExerciseWithExercise;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("routines.exercises");
  const tRoutines = useTranslations("routines");
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateRoutineExerciseAction,
    initialState,
  );

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
        <input type="hidden" name="dayId" value={dayId} />
        <input type="hidden" name="routineExerciseId" value={item.id} />
        <p className="font-medium capitalize">{item.exerciseName}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {t("sets")}
            <input
              name="targetSets"
              type="number"
              min={1}
              max={20}
              defaultValue={item.targetSets}
              required
              className="h-11 rounded-xl border border-border bg-surface px-2 tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("reps")}
            <input
              name="targetReps"
              type="text"
              defaultValue={item.targetReps}
              required
              className="h-11 rounded-xl border border-border bg-surface px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("rest")}
            <input
              name="restSeconds"
              type="number"
              min={0}
              max={600}
              defaultValue={item.restSeconds ?? ""}
              className="h-11 rounded-xl border border-border bg-surface px-2 tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-sm">
            {t("notes")}
            <input
              name="notes"
              type="text"
              defaultValue={item.notes ?? ""}
              className="h-11 rounded-xl border border-border bg-surface px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        </div>
        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? tRoutines("saving") : tRoutines("save")}
          </Button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground"
          >
            {tRoutines("cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <Image
        src={exerciseMediaUrl(item.exerciseImagePath)}
        alt={item.exerciseName}
        width={56}
        height={56}
        className="aspect-square rounded-xl object-cover"
      />
      <div className="flex-1">
        <p className="font-medium capitalize">{item.exerciseName}</p>
        <p className="text-sm tabular-nums text-muted">
          {item.targetSets} × {item.targetReps}
          {item.restSeconds ? ` · ${item.restSeconds}s` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <form action={moveRoutineExerciseAction}>
          <input type="hidden" name="dayId" value={dayId} />
          <input type="hidden" name="routineExerciseId" value={item.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            aria-label={t("moveUp")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground disabled:opacity-30"
          >
            ↑
          </button>
        </form>
        <form action={moveRoutineExerciseAction}>
          <input type="hidden" name="dayId" value={dayId} />
          <input type="hidden" name="routineExerciseId" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            aria-label={t("moveDown")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground disabled:opacity-30"
          >
            ↓
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-accent underline"
        >
          {t("edit")}
        </button>
        <form action={removeRoutineExerciseAction}>
          <input type="hidden" name="dayId" value={dayId} />
          <input type="hidden" name="routineExerciseId" value={item.id} />
          <button type="submit" className="text-sm font-medium text-muted underline">
            {t("remove")}
          </button>
        </form>
      </div>
    </div>
  );
}
