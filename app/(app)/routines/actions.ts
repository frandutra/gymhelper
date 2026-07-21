"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  archiveRoutine,
  createRoutine,
  renameRoutine,
} from "@/lib/db/queries/routines";
import { createClient } from "@/lib/supabase/server";
import { routineSchema } from "@/lib/validations/routines";

export type RoutineFormState = { error?: string };

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}

export async function createRoutineAction(
  _prevState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const t = await getTranslations("routines.validation");
  const parsed = routineSchema(t).safeParse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const userId = await requireUserId();
  await createRoutine(userId, parsed.data.name, parsed.data.notes || null);
  revalidatePath("/routines");
  return {};
}

export async function renameRoutineAction(
  _prevState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const t = await getTranslations("routines.validation");
  const parsed = routineSchema(t).safeParse({
    name: formData.get("name"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const routineId = formData.get("routineId");
  if (typeof routineId !== "string") return { error: t("nameRequired") };

  const userId = await requireUserId();
  await renameRoutine(userId, routineId, parsed.data.name, parsed.data.notes || null);
  revalidatePath("/routines");
  return {};
}

export async function archiveRoutineAction(formData: FormData) {
  const routineId = formData.get("routineId");
  if (typeof routineId !== "string") return;

  const userId = await requireUserId();
  await archiveRoutine(userId, routineId);
  revalidatePath("/routines");
}
