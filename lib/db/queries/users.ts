import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type UserSettings = typeof users.$inferSelect;

export async function getUserSettings(userId: string): Promise<UserSettings | undefined> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row;
}

export async function updateUnitPreference(userId: string, unitPreference: "kg" | "lb") {
  await db.update(users).set({ unitPreference }).where(eq(users.id, userId));
}

export async function updateLocale(userId: string, locale: "es" | "en") {
  await db.update(users).set({ locale }).where(eq(users.id, userId));
}
