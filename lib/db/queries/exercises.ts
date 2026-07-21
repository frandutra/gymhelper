import { and, asc, count, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyPart, exercises } from "@/lib/db/schema";

export type ExerciseListFilters = {
  query?: string;
  bodyPart?: string;
  equipment?: string;
  page: number;
  pageSize: number;
};

export function isValidBodyPart(value: string): value is (typeof bodyPart.enumValues)[number] {
  return (bodyPart.enumValues as readonly string[]).includes(value);
}

export async function listExercises(filters: ExerciseListFilters) {
  const conditions = [];
  if (filters.query) conditions.push(ilike(exercises.name, `%${filters.query}%`));
  if (filters.bodyPart && isValidBodyPart(filters.bodyPart)) {
    conditions.push(eq(exercises.bodyPart, filters.bodyPart));
  }
  if (filters.equipment) conditions.push(eq(exercises.equipment, filters.equipment));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        bodyPart: exercises.bodyPart,
        equipment: exercises.equipment,
        imagePath: exercises.imagePath,
      })
      .from(exercises)
      .where(where)
      .orderBy(asc(exercises.name))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    db.select({ total: count() }).from(exercises).where(where),
  ]);

  return { rows, total: totalRows[0]?.total ?? 0 };
}

export async function listEquipmentOptions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ equipment: exercises.equipment })
    .from(exercises)
    .orderBy(asc(exercises.equipment));
  return rows.map((r) => r.equipment);
}
