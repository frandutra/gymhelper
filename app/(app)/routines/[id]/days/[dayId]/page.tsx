import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RoutineExerciseRow } from "@/components/features/routine-exercise-row";
import {
  getRoutineDayWithOwner,
  listRoutineExercises,
} from "@/lib/db/queries/routine-exercises";
import { createClient } from "@/lib/supabase/server";

export default async function RoutineDayPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>;
}) {
  const { id: routineId, dayId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const day = await getRoutineDayWithOwner(user!.id, dayId);
  if (!day || day.routineId !== routineId) notFound();

  const [t, tDays, items] = await Promise.all([
    getTranslations("routines.exercises"),
    getTranslations("routines.days"),
    listRoutineExercises(dayId),
  ]);
  const weekdays = tDays.raw("weekdays") as string[];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <Link href={`/routines/${routineId}`} className="text-sm font-medium text-accent underline">
        ← {day.routineName}
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold capitalize tracking-tight">{day.dayName}</h1>
        {day.weekday !== null && <p className="text-sm text-muted">{weekdays[day.weekday]}</p>}
      </div>

      <Link
        href={`/exercises?dayId=${dayId}`}
        className="flex h-11 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-foreground"
      >
        {t("addExercise")}
      </Link>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={item.id}>
              <RoutineExerciseRow
                dayId={dayId}
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
