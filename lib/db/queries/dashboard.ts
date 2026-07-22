import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { routineDays, routines } from "@/lib/db/schema";

export type TodayRoutineDay = {
  dayId: string;
  dayName: string;
  routineId: string;
  routineName: string;
};

/** El primer día (entre rutinas activas) prescripto para ese día de la semana. */
export async function getTodayRoutineDay(
  userId: string,
  weekday: number,
): Promise<TodayRoutineDay | undefined> {
  const [row] = await db
    .select({
      dayId: routineDays.id,
      dayName: routineDays.name,
      routineId: routines.id,
      routineName: routines.name,
    })
    .from(routineDays)
    .innerJoin(routines, eq(routines.id, routineDays.routineId))
    .where(
      and(
        eq(routines.userId, userId),
        isNull(routines.archivedAt),
        eq(routineDays.weekday, weekday),
      ),
    )
    .orderBy(asc(routineDays.position))
    .limit(1);
  return row;
}

export type PickableRoutineDay = {
  dayId: string;
  dayName: string;
  weekday: number | null;
  routineId: string;
  routineName: string;
};

/** Todos los días de rutinas activas, para elegir manualmente. */
export function listPickableRoutineDays(userId: string): Promise<PickableRoutineDay[]> {
  return db
    .select({
      dayId: routineDays.id,
      dayName: routineDays.name,
      weekday: routineDays.weekday,
      routineId: routines.id,
      routineName: routines.name,
    })
    .from(routineDays)
    .innerJoin(routines, eq(routines.id, routineDays.routineId))
    .where(and(eq(routines.userId, userId), isNull(routines.archivedAt)))
    .orderBy(asc(routines.createdAt), asc(routineDays.position));
}
