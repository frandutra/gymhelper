import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { finishWorkoutSessionAction } from "@/app/(app)/workout/actions";
import { Button } from "@/components/ui/button";
import { getActiveSession } from "@/lib/db/queries/workout-sessions";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [t, locale, session] = await Promise.all([
    getTranslations("workout"),
    getLocale(),
    getActiveSession(user!.id),
  ]);

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
    </main>
  );
}
