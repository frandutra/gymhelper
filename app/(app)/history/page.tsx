import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { listFinishedSessions } from "@/lib/db/queries/workout-sessions";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [t, locale, sessions] = await Promise.all([
    getTranslations("history"),
    getLocale(),
    listFinishedSessions(user!.id),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/history/${session.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3"
              >
                <p className="font-medium capitalize">
                  {session.routineName && session.dayName
                    ? `${session.routineName} — ${session.dayName}`
                    : t("freeSession")}
                </p>
                <p className="text-sm tabular-nums text-muted">
                  {dateFormatter.format(session.startedAt)}
                </p>
                <p className="text-sm tabular-nums text-muted">
                  {t("summary", { exercises: session.exerciseCount, sets: session.totalSets })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
