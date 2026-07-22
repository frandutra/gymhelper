import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { logout } from "@/app/(auth)/actions";
import { startWorkoutSessionAction } from "@/app/(app)/workout/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/features/locale-switcher";
import {
  getTodayRoutineDay,
  listPickableRoutineDays,
  type PickableRoutineDay,
} from "@/lib/db/queries/dashboard";
import { getActiveSession, listFinishedSessions } from "@/lib/db/queries/workout-sessions";
import { createClient } from "@/lib/supabase/server";

const RECENT_SESSIONS_LIMIT = 3;

function groupByRoutine(days: PickableRoutineDay[]) {
  const groups = new Map<string, { routineId: string; routineName: string; days: PickableRoutineDay[] }>();
  for (const day of days) {
    if (!groups.has(day.routineId)) {
      groups.set(day.routineId, { routineId: day.routineId, routineName: day.routineName, days: [] });
    }
    groups.get(day.routineId)!.days.push(day);
  }
  return Array.from(groups.values());
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const today = new Date().getDay();

  const [
    t,
    tWorkout,
    tHistory,
    tDays,
    tExercises,
    tRoutines,
    tSettings,
    locale,
    activeSession,
    todayDay,
    pickableDays,
    recentSessions,
  ] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("workout"),
    getTranslations("history"),
    getTranslations("routines.days"),
    getTranslations("exercises"),
    getTranslations("routines"),
    getTranslations("settings"),
    getLocale(),
    getActiveSession(userId),
    getTodayRoutineDay(userId, today),
    listPickableRoutineDays(userId),
    listFinishedSessions(userId),
  ]);

  const weekdays = tDays.raw("weekdays") as string[];
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const remainingDays = pickableDays.filter((d) => d.dayId !== todayDay?.dayId);
  const groupedRoutines = groupByRoutine(remainingDays);

  return (
    <main className="flex flex-1 flex-col gap-5 p-4">
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
          {todayDay && (
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
          )}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-muted">{t("yourRoutines")}</p>
            {groupedRoutines.length === 0 ? (
              <div className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm text-muted">{t("noRoutinesYet")}</p>
                <Link href="/routines" className="text-sm font-medium text-accent underline">
                  {t("createRoutine")}
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {groupedRoutines.map((routine) => (
                  <li
                    key={routine.routineId}
                    className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3"
                  >
                    <p className="font-medium">{routine.routineName}</p>
                    <ul className="flex flex-col">
                      {routine.days.map((day) => (
                        <li
                          key={day.dayId}
                          className="flex items-center justify-between gap-2 border-t border-border py-2 first:border-t-0"
                        >
                          <span className="text-sm text-muted">
                            {day.dayName}
                            {day.weekday !== null ? ` · ${weekdays[day.weekday]}` : ""}
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {recentSessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">{t("recentSessions")}</p>
          <ul className="flex flex-col rounded-2xl border border-border bg-surface">
            {recentSessions.slice(0, RECENT_SESSIONS_LIMIT).map((session) => (
              <li key={session.id} className="border-t border-border first:border-t-0">
                <Link
                  href={`/history/${session.id}`}
                  className="flex items-center justify-between gap-2 p-3"
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
