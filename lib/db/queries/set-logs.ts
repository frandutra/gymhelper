import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { setLogs } from "@/lib/db/schema";

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
