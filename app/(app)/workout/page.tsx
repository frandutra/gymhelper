import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteSetLogAction, finishWorkoutSessionAction } from "@/app/(app)/workout/actions";
import { Button } from "@/components/ui/button";
import { SetLogger } from "@/components/features/set-logger";
import { listRoutineExercises } from "@/lib/db/queries/routine-exercises";
import { getLastTimeLog, listSetLogs } from "@/lib/db/queries/set-logs";
import { getUserSettings } from "@/lib/db/queries/users";
import { getActiveSession } from "@/lib/db/queries/workout-sessions";
import { exerciseMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { parseDefaultReps } from "@/lib/workout/defaults";
import { displayWeight } from "@/lib/workout/units";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [t, locale, session, settings] = await Promise.all([
    getTranslations("workout"),
    getLocale(),
    getActiveSession(userId),
    getUserSettings(userId),
  ]);
  const unit = settings?.unitPreference ?? "kg";

  if (!session) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
        <p className="text-sm text-muted">{t("noActiveSession")}</p>
        <Link href="/routines" className="text-sm font-medium text-accent underline">
          {t("goToRoutines")}
        </Link>
      </main>
    );
  }

  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  const exercises = session.routineDayId
    ? await listRoutineExercises(session.routineDayId)
    : [];
  const exercisesWithLogs = await Promise.all(
    exercises.map(async (exercise) => {
      const [logs, lastTime] = await Promise.all([
        listSetLogs(session.id, exercise.exerciseId),
        getLastTimeLog(userId, exercise.exerciseId, session.id),
      ]);
      return { exercise, logs, lastTime };
    }),
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-md">
        <p className="font-medium capitalize">
          {session.routineName && session.dayName
            ? `${session.routineName} — ${session.dayName}`
            : t("noDay")}
        </p>
        <p className="text-sm tabular-nums text-muted">
          {t("startedAt", { time: timeFormatter.format(session.startedAt) })}
        </p>
        <form action={finishWorkoutSessionAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          <Button type="submit">{t("finish")}</Button>
        </form>
      </div>

      {exercisesWithLogs.map(({ exercise, logs, lastTime }) => {
        const lastLog = logs[logs.length - 1];
        // Base en el máximo set_number existente, no en la cantidad de filas:
        // si se borra una serie intermedia, la próxima no debe repetir número.
        const nextSetNumber = lastLog ? lastLog.setNumber + 1 : 1;
        // Prioridad del default: última serie de ESTA sesión > "la última vez"
        // (sesión anterior) > parseo del rango de reps prescripto.
        const defaultWeight = lastLog?.weightKg ?? lastTime?.weightKg ?? 0;
        const defaultReps =
          lastLog?.reps ?? lastTime?.reps ?? parseDefaultReps(exercise.targetReps);

        return (
          <div
            key={exercise.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <Image
                src={exerciseMediaUrl(exercise.exerciseImagePath)}
                alt={exercise.exerciseName}
                width={48}
                height={48}
                className="aspect-square rounded-xl object-cover"
              />
              <div>
                <p className="font-medium capitalize">{exercise.exerciseName}</p>
                <p className="text-sm tabular-nums text-muted">
                  {t("target", { sets: exercise.targetSets, reps: exercise.targetReps })}
                </p>
                {lastTime && (
                  <p className="text-sm tabular-nums text-muted">
                    {t("lastTime", {
                      weight: displayWeight(lastTime.weightKg, unit),
                      unit,
                      reps: lastTime.reps,
                    })}
                  </p>
                )}
              </div>
            </div>

            {logs.length > 0 && (
              <ul className="flex flex-col gap-1">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between text-sm tabular-nums"
                  >
                    <span>
                      {t("loggedSet", {
                        number: log.setNumber,
                        weight: displayWeight(log.weightKg, unit),
                        unit,
                        reps: log.reps,
                      })}
                    </span>
                    <form action={deleteSetLogAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="setLogId" value={log.id} />
                      <button type="submit" className="text-muted underline">
                        {t("removeSet")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <SetLogger
              key={`${exercise.exerciseId}-${nextSetNumber}`}
              sessionId={session.id}
              exerciseId={exercise.exerciseId}
              setNumber={nextSetNumber}
              defaultWeightKg={defaultWeight}
              defaultReps={defaultReps}
              unit={unit}
            />
          </div>
        );
      })}
    </main>
  );
}
