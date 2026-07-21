import { config } from "dotenv";

// tsx corre este script fuera de Next.js: cargamos .env.local a mano y
// ANTES de crear el cliente de Drizzle (no reusamos el singleton de
// /lib/db porque ese módulo lee DATABASE_URL apenas se importa).
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { exercises } from "@/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema: { exercises } });

const DATASET_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

const BODY_PARTS = [
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
] as const;

// Valida el registro crudo del dataset (10 idiomas); solo nos quedamos con
// es/en al mapear (ver CLAUDE.md: recortamos instructions a {es, en}).
const rawExerciseSchema = z.object({
  id: z.string().regex(/^[0-9]{4}$/),
  name: z.string().min(1),
  body_part: z.enum(BODY_PARTS),
  equipment: z.string().min(1),
  instructions: z.record(z.string(), z.string()),
  instruction_steps: z.record(z.string(), z.array(z.string())),
  muscle_group: z.string().min(1),
  secondary_muscles: z.array(z.string().min(1)),
  target: z.string().min(1),
  image: z.string().regex(/^images\/.+\.(jpg|jpeg|png)$/),
  gif_url: z.string().regex(/^videos\/.+\.gif$/),
  attribution: z.string().min(1),
});

const BATCH_SIZE = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log(`Descargando dataset de ${DATASET_URL}...`);
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(`No se pudo descargar el dataset: ${res.status}`);
  }
  const raw: unknown[] = await res.json();
  console.log(`${raw.length} registros descargados. Validando...`);

  const rows = raw.map((entry, index) => {
    const parsed = rawExerciseSchema.safeParse(entry);
    if (!parsed.success) {
      throw new Error(
        `Registro inválido en índice ${index}: ${parsed.error.message}`,
      );
    }
    const r = parsed.data;

    const es = r.instructions.es;
    const en = r.instructions.en;
    const esSteps = r.instruction_steps.es;
    const enSteps = r.instruction_steps.en;
    if (!es || !en || !esSteps || !enSteps) {
      throw new Error(`Falta instructions es/en para dataset_id ${r.id}`);
    }

    return {
      datasetId: r.id,
      name: r.name,
      bodyPart: r.body_part,
      target: r.target,
      muscleGroup: r.muscle_group,
      secondaryMuscles: r.secondary_muscles,
      equipment: r.equipment,
      instructions: { es, en },
      instructionSteps: { es: esSteps, en: enSteps },
      imagePath: r.image,
      gifPath: r.gif_url,
      attribution: r.attribution,
    };
  });

  console.log(`Validación OK. Insertando/actualizando ${rows.length} filas...`);

  let processed = 0;
  for (const batch of chunk(rows, BATCH_SIZE)) {
    await db
      .insert(exercises)
      .values(batch)
      .onConflictDoUpdate({
        target: exercises.datasetId,
        set: {
          name: sql`excluded.name`,
          bodyPart: sql`excluded.body_part`,
          target: sql`excluded.target`,
          muscleGroup: sql`excluded.muscle_group`,
          secondaryMuscles: sql`excluded.secondary_muscles`,
          equipment: sql`excluded.equipment`,
          instructions: sql`excluded.instructions`,
          instructionSteps: sql`excluded.instruction_steps`,
          imagePath: sql`excluded.image_path`,
          gifPath: sql`excluded.gif_path`,
          attribution: sql`excluded.attribution`,
          updatedAt: sql`now()`,
        },
      });
    processed += batch.length;
    console.log(`  ${processed}/${rows.length}`);
  }

  console.log("Seed completo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
