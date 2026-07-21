import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { routineDays } from "@/lib/db/schema";

export type RoutineDayRow = typeof routineDays.$inferSelect;

export function listRoutineDays(routineId: string): Promise<RoutineDayRow[]> {
  return db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId))
    .orderBy(asc(routineDays.position));
}

export async function createRoutineDay(
  routineId: string,
  name: string,
  weekday: number | null,
): Promise<RoutineDayRow> {
  const [{ maxPosition }] = await db
    .select({ maxPosition: max(routineDays.position) })
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId));
  const position = (maxPosition ?? -1) + 1;

  const [row] = await db
    .insert(routineDays)
    .values({ routineId, name, weekday, position })
    .returning();
  return row;
}

export async function renameRoutineDay(
  routineId: string,
  dayId: string,
  name: string,
  weekday: number | null,
): Promise<RoutineDayRow | undefined> {
  const [row] = await db
    .update(routineDays)
    .set({ name, weekday })
    .where(and(eq(routineDays.id, dayId), eq(routineDays.routineId, routineId)))
    .returning();
  return row;
}

export async function deleteRoutineDay(routineId: string, dayId: string): Promise<void> {
  await db
    .delete(routineDays)
    .where(and(eq(routineDays.id, dayId), eq(routineDays.routineId, routineId)));
}

export async function moveRoutineDay(
  routineId: string,
  dayId: string,
  direction: "up" | "down",
): Promise<void> {
  const days = await listRoutineDays(routineId);
  const index = days.findIndex((d) => d.id === dayId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= days.length) return;

  const a = days[index];
  const b = days[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(routineDays).set({ position: b.position }).where(eq(routineDays.id, a.id));
    await tx.update(routineDays).set({ position: a.position }).where(eq(routineDays.id, b.id));
  });
}
