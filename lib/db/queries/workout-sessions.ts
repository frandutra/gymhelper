import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { routineDays, routines, workoutSessions } from "@/lib/db/schema";

export type ActiveWorkoutSession = {
  id: string;
  startedAt: Date;
  routineDayId: string | null;
  dayName: string | null;
  routineId: string | null;
  routineName: string | null;
};

export async function getActiveSession(
  userId: string,
): Promise<ActiveWorkoutSession | undefined> {
  const [row] = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      routineDayId: workoutSessions.routineDayId,
      dayName: routineDays.name,
      routineId: routines.id,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .leftJoin(routineDays, eq(routineDays.id, workoutSessions.routineDayId))
    .leftJoin(routines, eq(routines.id, routineDays.routineId))
    .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return row;
}

export async function startWorkoutSession(userId: string, routineDayId: string) {
  const [row] = await db
    .insert(workoutSessions)
    .values({ userId, routineDayId })
    .returning();
  return row;
}

export async function finishWorkoutSession(userId: string, sessionId: string) {
  const [row] = await db
    .update(workoutSessions)
    .set({ finishedAt: new Date() })
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
    .returning();
  return row;
}
