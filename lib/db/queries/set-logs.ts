import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { setLogs, workoutSessions } from "@/lib/db/schema";

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
