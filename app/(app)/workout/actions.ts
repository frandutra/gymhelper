"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRoutineDayWithOwner } from "@/lib/db/queries/routine-exercises";
import { deleteSetLog, logSet } from "@/lib/db/queries/set-logs";
import {
  finishWorkoutSession,
  getActiveSession,
  isSessionOwner,
  startWorkoutSession,
} from "@/lib/db/queries/workout-sessions";
import { createClient } from "@/lib/supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user.id;
}

export async function startWorkoutSessionAction(formData: FormData) {
  const dayId = formData.get("dayId");
  if (typeof dayId !== "string") return;

  const userId = await requireUserId();
  const day = await getRoutineDayWithOwner(userId, dayId);
  if (!day) throw new Error("Día no encontrado");

  // Una sola sesión en curso a la vez: si ya hay una activa, la resumimos
  // en vez de crear otra.
  const existing = await getActiveSession(userId);
  if (!existing) {
    await startWorkoutSession(userId, dayId);
  }

  redirect("/workout");
}

export async function finishWorkoutSessionAction(formData: FormData) {
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string") return;

  const userId = await requireUserId();
  await finishWorkoutSession(userId, sessionId);
  revalidatePath("/workout");
}

export async function logSetAction(input: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}) {
  const userId = await requireUserId();
  const owns = await isSessionOwner(userId, input.sessionId);
  if (!owns) throw new Error("Sesión no encontrada");

  await logSet(
    userId,
    input.sessionId,
    input.exerciseId,
    input.setNumber,
    input.weightKg,
    input.reps,
  );
  revalidatePath("/workout");
}

export async function deleteSetLogAction(formData: FormData) {
  const sessionId = formData.get("sessionId");
  const setLogId = formData.get("setLogId");
  if (typeof sessionId !== "string" || typeof setLogId !== "string") return;

  const userId = await requireUserId();
  const owns = await isSessionOwner(userId, sessionId);
  if (!owns) throw new Error("Sesión no encontrada");

  await deleteSetLog(userId, sessionId, setLogId);
  revalidatePath("/workout");
}
