import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, setLogs, workoutSessions } from "@/lib/db/schema";

export type SetLogRow = typeof setLogs.$inferSelect;

export function listSetLogs(sessionId: string, exerciseId: string): Promise<SetLogRow[]> {
  return db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.sessionId, sessionId), eq(setLogs.exerciseId, exerciseId)))
    .orderBy(asc(setLogs.setNumber));
}

export async function logSet(
  userId: string,
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weightKg: number,
  reps: number,
): Promise<SetLogRow> {
  const [row] = await db
    .insert(setLogs)
    .values({ userId, sessionId, exerciseId, setNumber, weightKg, reps })
    .returning();
  return row;
}

export type LastTimeLog = { weightKg: number; reps: number };

/**
 * Última serie registrada de este ejercicio en una sesión ANTERIOR a la
 * actual (no la sesión en curso — ese caso ya lo cubre listSetLogs).
 */
export async function getLastTimeLog(
  userId: string,
  exerciseId: string,
  excludeSessionId: string,
): Promise<LastTimeLog | undefined> {
  const [row] = await db
    .select({ weightKg: setLogs.weightKg, reps: setLogs.reps })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(workoutSessions.id, setLogs.sessionId))
    .where(
      and(
        eq(setLogs.userId, userId),
        eq(setLogs.exerciseId, exerciseId),
        ne(setLogs.sessionId, excludeSessionId),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt), desc(setLogs.setNumber))
    .limit(1);
  return row;
}

export type SessionExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  exerciseImagePath: string;
  sets: { setNumber: number; weightKg: number; reps: number }[];
};

/**
 * Series de una sesión agrupadas por ejercicio, en el orden en que se
 * empezaron a loguear (no hay una columna de "orden de ejercicios" en la
 * sesión; el orden cronológico de la primera serie de cada uno alcanza).
 */
export async function listSessionExerciseLogs(sessionId: string): Promise<SessionExerciseLog[]> {
  const rows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      exerciseName: exercises.name,
      exerciseImagePath: exercises.imagePath,
      setNumber: setLogs.setNumber,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      createdAt: setLogs.createdAt,
    })
    .from(setLogs)
    .innerJoin(exercises, eq(exercises.id, setLogs.exerciseId))
    .where(eq(setLogs.sessionId, sessionId))
    .orderBy(asc(setLogs.createdAt));

  const grouped = new Map<string, SessionExerciseLog>();
  for (const row of rows) {
    if (!grouped.has(row.exerciseId)) {
      grouped.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        exerciseImagePath: row.exerciseImagePath,
        sets: [],
      });
    }
    grouped.get(row.exerciseId)!.sets.push({
      setNumber: row.setNumber,
      weightKg: row.weightKg,
      reps: row.reps,
    });
  }

  for (const group of grouped.values()) {
    group.sets.sort((a, b) => a.setNumber - b.setNumber);
  }

  return Array.from(grouped.values());
}

export async function deleteSetLog(userId: string, sessionId: string, setLogId: string) {
  await db
    .delete(setLogs)
    .where(
      and(
        eq(setLogs.id, setLogId),
        eq(setLogs.sessionId, sessionId),
        eq(setLogs.userId, userId),
      ),
    );
}
