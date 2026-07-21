"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  createRoutineDay,
  deleteRoutineDay,
  moveRoutineDay,
  renameRoutineDay,
} from "@/lib/db/queries/routine-days";
import { getRoutineById } from "@/lib/db/queries/routines";
import { createClient } from "@/lib/supabase/server";
import { routineDaySchema } from "@/lib/validations/routine-days";

export type RoutineDayFormState = { error?: string };

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}

async function requireOwnedRoutine(userId: string, routineId: string) {
  const routine = await getRoutineById(userId, routineId);
  if (!routine) throw new Error("Rutina no encontrada");
  return routine;
}

function parseWeekday(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value === "") return null;
  return Number(value);
}

export async function createDayAction(
  _prevState: RoutineDayFormState,
  formData: FormData,
): Promise<RoutineDayFormState> {
  const routineId = formData.get("routineId");
  if (typeof routineId !== "string") return { error: "routineId faltante" };

  const t = await getTranslations("routines.days.validation");
  const parsed = routineDaySchema(t).safeParse({
    name: formData.get("name"),
    weekday: formData.get("weekday") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await requireUserId();
  await requireOwnedRoutine(userId, routineId);
  await createRoutineDay(routineId, parsed.data.name, parseWeekday(formData.get("weekday")));
  revalidatePath(`/routines/${routineId}`);
  return {};
}

export async function renameDayAction(
  _prevState: RoutineDayFormState,
  formData: FormData,
): Promise<RoutineDayFormState> {
  const routineId = formData.get("routineId");
  const dayId = formData.get("dayId");
  if (typeof routineId !== "string" || typeof dayId !== "string") {
    return { error: "datos faltantes" };
  }

  const t = await getTranslations("routines.days.validation");
  const parsed = routineDaySchema(t).safeParse({
    name: formData.get("name"),
    weekday: formData.get("weekday") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await requireUserId();
  await requireOwnedRoutine(userId, routineId);
  await renameRoutineDay(
    routineId,
    dayId,
    parsed.data.name,
    parseWeekday(formData.get("weekday")),
  );
  revalidatePath(`/routines/${routineId}`);
  return {};
}

export async function deleteDayAction(formData: FormData) {
  const routineId = formData.get("routineId");
  const dayId = formData.get("dayId");
  if (typeof routineId !== "string" || typeof dayId !== "string") return;

  const userId = await requireUserId();
  await requireOwnedRoutine(userId, routineId);
  await deleteRoutineDay(routineId, dayId);
  revalidatePath(`/routines/${routineId}`);
}

export async function moveDayAction(formData: FormData) {
  const routineId = formData.get("routineId");
  const dayId = formData.get("dayId");
  const direction = formData.get("direction");
  if (
    typeof routineId !== "string" ||
    typeof dayId !== "string" ||
    (direction !== "up" && direction !== "down")
  ) {
    return;
  }

  const userId = await requireUserId();
  await requireOwnedRoutine(userId, routineId);
  await moveRoutineDay(routineId, dayId, direction);
  revalidatePath(`/routines/${routineId}`);
}
