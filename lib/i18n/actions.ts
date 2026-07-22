"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/i18n/request";
import { updateLocale } from "@/lib/db/queries/users";
import { createClient } from "@/lib/supabase/server";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLocale(locale: Locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  // Persistimos también en users.locale (no solo la cookie) para que la
  // preferencia viaje entre dispositivos, no solo en este navegador.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await updateLocale(user.id, locale);
  }

  revalidatePath("/", "layout");
}
