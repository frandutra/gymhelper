"use server";

import { revalidatePath } from "next/cache";
import { updateUnitPreference } from "@/lib/db/queries/users";
import { createClient } from "@/lib/supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}

export async function updateUnitPreferenceAction(formData: FormData) {
  const unit = formData.get("unitPreference");
  if (unit !== "kg" && unit !== "lb") return;

  const userId = await requireUserId();
  await updateUnitPreference(userId, unit);
  revalidatePath("/settings");
  revalidatePath("/workout");
}
