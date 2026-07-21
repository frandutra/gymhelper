"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  deleteDayAction,
  moveDayAction,
  renameDayAction,
  type RoutineDayFormState,
} from "@/app/(app)/routines/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoutineDayRow as RoutineDayRowType } from "@/lib/db/queries/routine-days";
import type { RoutineExerciseWithExercise } from "@/lib/db/queries/routine-exercises";
import { exerciseMediaUrl } from "@/lib/media";

const initialState: RoutineDayFormState = {};

export function RoutineDayRow({
  routineId,
  day,
  exercises,
  isFirst,
  isLast,
}: {
  routineId: string;
  day: RoutineDayRowType;
  exercises: RoutineExerciseWithExercise[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("routines.days");
  const tRoutines = useTranslations("routines");
  const tExercises = useTranslations("routines.exercises");
  const weekdays = t.raw("weekdays") as string[];
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(renameDayAction, initialState);

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
        <input type="hidden" name="routineId" value={routineId} />
        <input type="hidden" name="dayId" value={day.id} />
        <Input
          id={`day-name-${day.id}`}
          name="name"
          label={t("namePlaceholder")}
          defaultValue={day.name}
          required
        />
        <div className="flex flex-col gap-1">
          <label htmlFor={`day-weekday-${day.id}`} className="text-sm font-medium text-foreground">
            {t("weekdayLabel")}
          </label>
          <select
            id={`day-weekday-${day.id}`}
            name="weekday"
            defaultValue={day.weekday ?? ""}
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/routines/${routineId}/days/${day.id}`} className="flex-1">
          <p className="font-medium underline">{day.name}</p>
          <p className="text-sm text-muted">
            {day.weekday !== null ? weekdays[day.weekday] : t("weekdayNone")}
          </p>
        </Link>
        <div className="flex items-center gap-2">
          <form action={moveDayAction}>
            <input type="hidden" name="routineId" value={routineId} />
            <input type="hidden" name="dayId" value={day.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              aria-label={t("moveUp")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-30"
            >
              ↑
            </button>
          </form>
          <form action={moveDayAction}>
            <input type="hidden" name="routineId" value={routineId} />
            <input type="hidden" name="dayId" value={day.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              aria-label={t("moveDown")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-30"
            >
              ↓
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-accent underline"
          >
            {tRoutines("rename")}
          </button>
          <form action={deleteDayAction}>
            <input type="hidden" name="routineId" value={routineId} />
            <input type="hidden" name="dayId" value={day.id} />
            <button type="submit" className="text-sm font-medium text-muted underline">
              {t("delete")}
            </button>
          </form>
        </div>
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-muted">{tExercises("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2 border-t border-border pt-2">
          {exercises.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <Image
                src={exerciseMediaUrl(item.exerciseImagePath)}
                alt={item.exerciseName}
                width={40}
                height={40}
                className="aspect-square rounded-lg object-cover"
              />
              <span className="flex-1 text-sm capitalize">{item.exerciseName}</span>
              <span className="text-sm tabular-nums text-muted">
                {item.targetSets} × {item.targetReps}
                {item.restSeconds ? ` · ${item.restSeconds}s` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
