import { getTranslations } from "next-intl/server";
import { updateUnitPreferenceAction } from "@/app/(app)/settings/actions";
import { LocaleSwitcher } from "@/components/features/locale-switcher";
import { getUserSettings } from "@/lib/db/queries/users";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [t, settings] = await Promise.all([
    getTranslations("settings"),
    getUserSettings(user!.id),
  ]);
  const unit = settings?.unitPreference ?? "kg";

  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{t("languageLabel")}</span>
        <LocaleSwitcher />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{t("unitLabel")}</span>
        <div className="flex gap-2">
          <form action={updateUnitPreferenceAction} className="flex-1">
            <input type="hidden" name="unitPreference" value="kg" />
            <button
              type="submit"
              className={`h-11 w-full rounded-xl border font-semibold ${
                unit === "kg"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-foreground"
              }`}
            >
              {t("unitKg")}
            </button>
          </form>
          <form action={updateUnitPreferenceAction} className="flex-1">
            <input type="hidden" name="unitPreference" value="lb" />
            <button
              type="submit"
              className={`h-11 w-full rounded-xl border font-semibold ${
                unit === "lb"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-foreground"
              }`}
            >
              {t("unitLb")}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">{t("accountLabel")}</span>
        <p className="text-sm text-muted">{user?.email}</p>
      </div>
    </main>
  );
}
