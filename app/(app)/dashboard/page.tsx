import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { logout } from "@/app/(auth)/actions";
import { startWorkoutSessionAction } from "@/app/(app)/workout/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/features/locale-switcher";
import { getTodayRoutineDay, listPickableRoutineDays } from "@/lib/db/queries/dashboard";
import { getActiveSession, listFinishedSessions } from "@/lib/db/queries/workout-sessions";
import { createClient } from "@/lib/supabase/server";

const RECENT_SESSIONS_LIMIT = 3;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const today = new Date().getDay();

  const [t, tWorkout, tHistory, tExercises, tRoutines, tSettings, locale, activeSession, todayDay, pickableDays, recentSessions] =
    await Promise.all([
      getTranslations("dashboard"),
      getTranslations("workout"),
      getTranslations("history"),
      getTranslations("exercises"),
      getTranslations("routines"),
      getTranslations("settings"),
      getLocale(),
      getActiveSession(userId),
      getTodayRoutineDay(userId, today),
      listPickableRoutineDays(userId),
      listFinishedSessions(userId),
    ]);

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const otherDays = pickableDays.filter((d) => d.dayId !== todayDay?.dayId);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{t("sessionAs", { email: user?.email ?? "" })}</p>
        <LocaleSwitcher />
      </div>

      {activeSession ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-md">
          <p className="font-medium">
            {t("activeSessionBanner", {
              routine: activeSession.routineName ?? "",
              day: activeSession.dayName ?? "",
            })}
          </p>
          <Link
            href="/workout"
            className="flex h-11 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-foreground"
          >
            {t("continueSession")}
          </Link>
        </div>
      ) : (
        <>
          {todayDay ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-md">
              <p className="font-medium">
                {t("today", { routine: todayDay.routineName, day: todayDay.dayName })}
              </p>
              <form action={startWorkoutSessionAction}>
                <input type="hidden" name="dayId" value={todayDay.dayId} />
                <Button type="submit" className="w-full">
                  {tWorkout("startWorkout")}
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted">{t("noToday")}</p>
          )}

          {otherDays.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-muted">{t("pickAnother")}</p>
              <ul className="flex flex-col gap-2">
                {otherDays.map((day) => (
                  <li
                    key={day.dayId}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3"
                  >
                    <span className="font-medium">
                      {day.routineName} — {day.dayName}
                    </span>
                    <form action={startWorkoutSessionAction}>
                      <input type="hidden" name="dayId" value={day.dayId} />
                      <button
                        type="submit"
                        className="h-9 rounded-xl border border-border px-3 text-sm font-semibold text-foreground"
                      >
                        {tWorkout("startWorkout")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {recentSessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">{t("recentSessions")}</p>
          <ul className="flex flex-col gap-2">
            {recentSessions.slice(0, RECENT_SESSIONS_LIMIT).map((session) => (
              <li key={session.id}>
                <Link
                  href={`/history/${session.id}`}
                  className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3"
                >
                  <span className="font-medium">
                    {session.routineName && session.dayName
                      ? `${session.routineName} — ${session.dayName}`
                      : tHistory("freeSession")}
                  </span>
                  <span className="text-sm tabular-nums text-muted">
                    {dateFormatter.format(session.startedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/history" className="text-sm font-medium text-accent underline">
            {t("viewAllHistory")}
          </Link>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-3 text-sm">
        <Link href="/exercises" className="font-medium text-accent underline">
          {tExercises("title")}
        </Link>
        <Link href="/routines" className="font-medium text-accent underline">
          {tRoutines("title")}
        </Link>
        <Link href="/settings" className="font-medium text-accent underline">
          {tSettings("title")}
        </Link>
        <form action={logout}>
          <button type="submit" className="font-medium text-muted underline">
            {t("logout")}
          </button>
        </form>
      </div>
    </main>
  );
}
