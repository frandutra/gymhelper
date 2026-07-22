import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schema de GymHelper. Fuente de verdad del modelo de datos (ver CLAUDE.md).
 * Todas las tablas con id (uuid), created_at, updated_at, y RLS activa.
 * `exercises` es la única tabla global (catálogo, sin user_id): RLS de
 * solo lectura, el seed la puebla con la service role key (bypassea RLS).
 */

// --- Enums ---

export const bodyPart = pgEnum("body_part", [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
]);

export const locale = pgEnum("locale", ["es", "en"]);

export const unitPreference = pgEnum("unit_preference", ["kg", "lb"]);

// --- Helpers comunes ---

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// --- Tablas ---

/**
 * Perfil + configuración del dominio. La auth la maneja Supabase;
 * users.id coincide con auth.uid (la FK a auth.users se enlaza en el slice de auth).
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  locale: locale("locale").notNull().default("es"),
  unitPreference: unitPreference("unit_preference").notNull().default("kg"),
  ...timestamps,
}).enableRLS();

/**
 * Catálogo global de ejercicios (dataset exercises-dataset, ~1324 filas).
 * Sin user_id: la comparten todos los usuarios. Solo lectura desde la app;
 * la escribe el seed (scripts/seed-exercises.ts) con la service role key.
 */
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  // id del dataset original ("0001"…"1324"). Único: clave de idempotencia del seed.
  datasetId: text("dataset_id").notNull().unique(),
  name: text("name").notNull(),
  bodyPart: bodyPart("body_part").notNull(),
  target: text("target").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  secondaryMuscles: text("secondary_muscles").array().notNull().default([]),
  equipment: text("equipment").notNull(),
  instructions: jsonb("instructions")
    .$type<{ es: string; en: string }>()
    .notNull(),
  instructionSteps: jsonb("instruction_steps")
    .$type<{ es: string[]; en: string[] }>()
    .notNull(),
  imagePath: text("image_path").notNull(),
  gifPath: text("gif_path").notNull(),
  attribution: text("attribution").notNull(),
  ...timestamps,
}).enableRLS();

/** Una rutina de entrenamiento (ej. "PPL", "Upper/Lower"). */
export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}).enableRLS();

/** Un día de entrenamiento dentro de una rutina (ej. "Push"). */
export const routineDays = pgTable("routine_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // 0-6 (domingo-sábado), opcional
  weekday: integer("weekday"),
  position: integer("position").notNull(),
  ...timestamps,
}).enableRLS();

/** Un ejercicio prescripto dentro de un día, con su objetivo de series/reps. */
export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineDayId: uuid("routine_day_id")
    .notNull()
    .references(() => routineDays.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  position: integer("position").notNull(),
  targetSets: integer("target_sets").notNull(),
  // Rango libre: "8-12", "5", "AMRAP"
  targetReps: text("target_reps").notNull(),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  ...timestamps,
}).enableRLS();

/**
 * Una sesión de entrenamiento (una visita al gimnasio). routineDayId es
 * nullable con onDelete "set null": si se borra el día de rutina, el
 * historial de la sesión no se pierde.
 */
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  routineDayId: uuid("routine_day_id").references(() => routineDays.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  notes: text("notes"),
  ...timestamps,
}).enableRLS();

/**
 * Una serie registrada. Referencia el ejercicio directamente (no
 * routine_exercises): editar la rutina nunca rompe el historial. userId
 * está denormalizado para que las políticas RLS sean triviales.
 */
export const setLogs = pgTable("set_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  // Siempre en kg (0 = peso corporal). La conversión a lb es solo de presentación.
  weightKg: numeric("weight_kg", { mode: "number" }).notNull(),
  reps: integer("reps").notNull(),
  notes: text("notes"),
  ...timestamps,
}).enableRLS();
