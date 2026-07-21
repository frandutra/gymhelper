"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  addExerciseToDay,
  getRoutineDayWithOwner,
  moveRoutineExercise,
  removeRoutineExercise,
  updateRoutineExercise,
} from "@/lib/db/queries/routine-exercises";
import { createClient } from "@/lib/supabase/server";
import { routineExerciseSchema } from "@/lib/validations/routine-exercises";

export type RoutineExerciseFormState = { error?: string };

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}

async function requireOwnedDay(userId: string, dayId: string) {
  const day = await getRoutineDayWithOwner(userId, dayId);
  if (!day) throw new Error("Día no encontrado");
  return day;
}

export async function addExerciseAction(formData: FormData) {
  const dayId = formData.get("dayId");
  const exerciseId = formData.get("exerciseId");
  if (typeof dayId !== "string" || typeof exerciseId !== "string") return;

  const userId = await requireUserId();
  await requireOwnedDay(userId, dayId);
  await addExerciseToDay(dayId, exerciseId);
  revalidatePath("/exercises");
}

export async function updateRoutineExerciseAction(
  _prevState: RoutineExerciseFormState,
  formData: FormData,
): Promise<RoutineExerciseFormState> {
  const dayId = formData.get("dayId");
  const routineExerciseId = formData.get("routineExerciseId");
  if (typeof dayId !== "string" || typeof routineExerciseId !== "string") {
    return { error: "datos faltantes" };
  }

  const t = await getTranslations("routines.exercises.validation");
  const parsed = routineExerciseSchema(t).safeParse({
    targetSets: formData.get("targetSets"),
    targetReps: formData.get("targetReps"),
    restSeconds: formData.get("restSeconds"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await requireUserId();
  const day = await requireOwnedDay(userId, dayId);
  await updateRoutineExercise(dayId, routineExerciseId, {
    targetSets: parsed.data.targetSets,
    targetReps: parsed.data.targetReps,
    restSeconds: parsed.data.restSeconds ?? null,
    notes: parsed.data.notes || null,
  });
  revalidatePath(`/routines/${day.routineId}/days/${dayId}`);
  return {};
}

export async function removeRoutineExerciseAction(formData: FormData) {
  const dayId = formData.get("dayId");
  const routineExerciseId = formData.get("routineExerciseId");
  if (typeof dayId !== "string" || typeof routineExerciseId !== "string") return;

  const userId = await requireUserId();
  const day = await requireOwnedDay(userId, dayId);
  await removeRoutineExercise(dayId, routineExerciseId);
  revalidatePath(`/routines/${day.routineId}/days/${dayId}`);
}

export async function moveRoutineExerciseAction(formData: FormData) {
  const dayId = formData.get("dayId");
  const routineExerciseId = formData.get("routineExerciseId");
  const direction = formData.get("direction");
  if (
    typeof dayId !== "string" ||
    typeof routineExerciseId !== "string" ||
    (direction !== "up" && direction !== "down")
  ) {
    return;
  }

  const userId = await requireUserId();
  const day = await requireOwnedDay(userId, dayId);
  await moveRoutineExercise(dayId, routineExerciseId, direction);
  revalidatePath(`/routines/${day.routineId}/days/${dayId}`);
}
