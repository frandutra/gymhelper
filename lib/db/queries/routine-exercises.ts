import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, routineDays, routineExercises, routines } from "@/lib/db/schema";

export type RoutineDayWithOwner = {
  dayId: string;
  dayName: string;
  weekday: number | null;
  routineId: string;
  routineName: string;
};

export async function getRoutineDayWithOwner(
  userId: string,
  dayId: string,
): Promise<RoutineDayWithOwner | undefined> {
  const [row] = await db
    .select({
      dayId: routineDays.id,
      dayName: routineDays.name,
      weekday: routineDays.weekday,
      routineId: routines.id,
      routineName: routines.name,
    })
    .from(routineDays)
    .innerJoin(routines, eq(routines.id, routineDays.routineId))
    .where(and(eq(routineDays.id, dayId), eq(routines.userId, userId)));
  return row;
}

export type RoutineExerciseWithExercise = {
  id: string;
  position: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number | null;
  notes: string | null;
  exerciseId: string;
  exerciseName: string;
  exerciseImagePath: string;
};

export function listRoutineExercises(dayId: string): Promise<RoutineExerciseWithExercise[]> {
  return db
    .select({
      id: routineExercises.id,
      position: routineExercises.position,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      restSeconds: routineExercises.restSeconds,
      notes: routineExercises.notes,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseImagePath: exercises.imagePath,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
    .where(eq(routineExercises.routineDayId, dayId))
    .orderBy(asc(routineExercises.position));
}

export async function listExerciseIdsInDay(dayId: string): Promise<Set<string>> {
  const rows = await db
    .select({ exerciseId: routineExercises.exerciseId })
    .from(routineExercises)
    .where(eq(routineExercises.routineDayId, dayId));
  return new Set(rows.map((r) => r.exerciseId));
}

const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = "10";

export async function addExerciseToDay(dayId: string, exerciseId: string) {
  const [{ maxPosition }] = await db
    .select({ maxPosition: max(routineExercises.position) })
    .from(routineExercises)
    .where(eq(routineExercises.routineDayId, dayId));
  const position = (maxPosition ?? -1) + 1;

  const [row] = await db
    .insert(routineExercises)
    .values({
      routineDayId: dayId,
      exerciseId,
      position,
      targetSets: DEFAULT_TARGET_SETS,
      targetReps: DEFAULT_TARGET_REPS,
    })
    .returning();
  return row;
}

export async function updateRoutineExercise(
  dayId: string,
  routineExerciseId: string,
  data: {
    targetSets: number;
    targetReps: string;
    restSeconds: number | null;
    notes: string | null;
  },
) {
  const [row] = await db
    .update(routineExercises)
    .set(data)
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineDayId, dayId),
      ),
    )
    .returning();
  return row;
}

export async function removeRoutineExercise(dayId: string, routineExerciseId: string) {
  await db
    .delete(routineExercises)
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineDayId, dayId),
      ),
    );
}

export async function moveRoutineExercise(
  dayId: string,
  routineExerciseId: string,
  direction: "up" | "down",
) {
  const list = await listRoutineExercises(dayId);
  const index = list.findIndex((r) => r.id === routineExerciseId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const a = list[index];
  const b = list[swapIndex];

  await db.transaction(async (tx) => {
    await tx
      .update(routineExercises)
      .set({ position: b.position })
      .where(eq(routineExercises.id, a.id));
    await tx
      .update(routineExercises)
      .set({ position: a.position })
      .where(eq(routineExercises.id, b.id));
  });
}
