import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { listSessionExerciseLogs } from "@/lib/db/queries/set-logs";
import { getUserSettings } from "@/lib/db/queries/users";
import { getFinishedSessionById } from "@/lib/db/queries/workout-sessions";
import { exerciseMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { displayWeight } from "@/lib/workout/units";

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const session = await getFinishedSessionById(userId, sessionId);
  if (!session || !session.finishedAt) notFound();

  const [t, locale, settings, exercises] = await Promise.all([
    getTranslations("history"),
    getLocale(),
    getUserSettings(userId),
    listSessionExerciseLogs(sessionId),
  ]);
  const unit = settings?.unitPreference ?? "kg";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <Link href="/history" className="text-sm font-medium text-accent underline">
        ← {t("title")}
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold capitalize tracking-tight">
          {session.routineName && session.dayName
            ? `${session.routineName} — ${session.dayName}`
            : t("freeSession")}
        </h1>
        <p className="text-sm tabular-nums text-muted">{dateFormatter.format(session.startedAt)}</p>
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-muted">{t("emptySession")}</p>
      ) : (
        exercises.map((exercise) => (
          <div
            key={exercise.exerciseId}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3"
          >
            <div className="flex items-center gap-3">
              <Image
                src={exerciseMediaUrl(exercise.exerciseImagePath)}
                alt={exercise.exerciseName}
                width={40}
                height={40}
                className="aspect-square rounded-lg object-cover"
              />
              <p className="font-medium capitalize">{exercise.exerciseName}</p>
            </div>
            <ul className="flex flex-col gap-1 text-sm tabular-nums text-muted">
              {exercise.sets.map((set) => (
                <li key={set.setNumber}>
                  {t("setLine", {
                    number: set.setNumber,
                    weight: displayWeight(set.weightKg, unit),
                    unit,
                    reps: set.reps,
                  })}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </main>
  );
}
