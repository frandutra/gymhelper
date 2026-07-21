import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CreateRoutineDayForm } from "@/components/features/create-routine-day-form";
import { RoutineDayRow } from "@/components/features/routine-day-row";
import { listRoutineDays } from "@/lib/db/queries/routine-days";
import { getRoutineById } from "@/lib/db/queries/routines";
import { createClient } from "@/lib/supabase/server";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const routine = await getRoutineById(user!.id, id);
  if (!routine) notFound();

  const [t, days] = await Promise.all([
    getTranslations("routines.days"),
    listRoutineDays(routine.id),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-extrabold capitalize tracking-tight">{routine.name}</h1>

      <CreateRoutineDayForm routineId={routine.id} />

      {days.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.map((day, index) => (
            <li key={day.id}>
              <RoutineDayRow
                routineId={routine.id}
                day={day}
                isFirst={index === 0}
                isLast={index === days.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
