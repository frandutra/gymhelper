import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { routines } from "@/lib/db/schema";

export type RoutineRow = typeof routines.$inferSelect;

// El cliente de /lib/db conecta con el rol `postgres` del pooler, que
// bypassea RLS (ver migraciones 0005+). Toda query acá filtra por userId
// explícitamente — RLS es defensa en profundidad, no lo único que aísla
// usuarios a nivel de la app.

export function listRoutines(userId: string): Promise<RoutineRow[]> {
  return db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), isNull(routines.archivedAt)))
    .orderBy(desc(routines.createdAt));
}

export function listArchivedRoutines(userId: string): Promise<RoutineRow[]> {
  return db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), isNotNull(routines.archivedAt)))
    .orderBy(desc(routines.archivedAt));
}

export async function createRoutine(
  userId: string,
  name: string,
  notes: string | null,
): Promise<RoutineRow> {
  const [row] = await db.insert(routines).values({ userId, name, notes }).returning();
  return row;
}

export async function renameRoutine(
  userId: string,
  routineId: string,
  name: string,
  notes: string | null,
): Promise<RoutineRow | undefined> {
  const [row] = await db
    .update(routines)
    .set({ name, notes })
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning();
  return row;
}

export async function getRoutineById(
  userId: string,
  routineId: string,
): Promise<RoutineRow | undefined> {
  const [row] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  return row;
}

export async function archiveRoutine(
  userId: string,
  routineId: string,
): Promise<RoutineRow | undefined> {
  const [row] = await db
    .update(routines)
    .set({ archivedAt: new Date() })
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning();
  return row;
}
