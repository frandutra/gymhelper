import { getLocale, getTranslations } from "next-intl/server";
import { CreateRoutineForm } from "@/components/features/create-routine-form";
import { RoutineRow } from "@/components/features/routine-row";
import { listArchivedRoutines, listRoutines } from "@/lib/db/queries/routines";
import { createClient } from "@/lib/supabase/server";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // El guard de app/(app)/layout.tsx ya garantiza que hay usuario acá.
  const userId = user!.id;

  const [t, locale, active, archived] = await Promise.all([
    getTranslations("routines"),
    getLocale(),
    listRoutines(userId),
    listArchivedRoutines(userId),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(locale);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      <CreateRoutineForm />

      {active.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((routine) => (
            <li key={routine.id}>
              <RoutineRow routine={routine} />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted">{t("archived")}</h2>
          <ul className="flex flex-col gap-2">
            {archived.map((routine) => (
              <li
                key={routine.id}
                className="rounded-2xl border border-border bg-surface p-3 opacity-60"
              >
                <p className="font-medium">{routine.name}</p>
                <p className="text-xs text-muted">
                  {t("archivedOn", {
                    date: routine.archivedAt ? dateFormatter.format(routine.archivedAt) : "",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
