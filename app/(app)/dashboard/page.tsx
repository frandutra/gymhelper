import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/features/locale-switcher";
import { createClient } from "@/lib/supabase/server";

// Placeholder: el dashboard real ("qué me toca hoy") se construye en Fase 3.6.
export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tExercises = await getTranslations("exercises");
  const tRoutines = await getTranslations("routines");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <LocaleSwitcher />
      <p className="text-sm text-muted">
        {t("sessionAs", { email: user?.email ?? "" })}
      </p>
      <Link href="/exercises" className="font-medium text-accent underline">
        {tExercises("title")}
      </Link>
      <Link href="/routines" className="font-medium text-accent underline">
        {tRoutines("title")}
      </Link>
      <form action={logout}>
        <Button type="submit">{t("logout")}</Button>
      </form>
    </main>
  );
}
