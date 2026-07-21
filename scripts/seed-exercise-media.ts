import { config } from "dotenv";

// tsx corre este script fuera de Next.js: cargar env ANTES de crear clientes.
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const BUCKET = "exercise-media";
const DATASET_RAW_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";
const CONCURRENCY = 15;

// Límite opcional para probar con pocos ejercicios: `npm run db:seed:media -- --limit=5`
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

function contentTypeFor(path: string): string {
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".png")) return "image/png";
  return "image/jpeg";
}

async function publicUrlExists(path: string): Promise<boolean> {
  const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

async function uploadPath(path: string): Promise<"uploaded" | "skipped" | "failed"> {
  try {
    if (await publicUrlExists(path)) return "skipped";

    const sourceUrl = `${DATASET_RAW_BASE}/${path}`;
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      console.error(`  ✗ descarga falló ${path}: ${res.status}`);
      return "failed";
    }
    const buffer = Buffer.from(await res.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: contentTypeFor(path), upsert: true });

    if (error) {
      console.error(`  ✗ upload falló ${path}: ${error.message}`);
      return "failed";
    }
    return "uploaded";
  } catch (err) {
    console.error(`  ✗ error ${path}:`, err);
    return "failed";
  }
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" ya existe.`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createError) throw createError;
  console.log(`Bucket "${BUCKET}" creado (público).`);
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let next = 0;
  async function runNext(): Promise<void> {
    const index = next++;
    if (index >= items.length) return;
    await worker(items[index], index);
    return runNext();
  }
  await Promise.all(Array.from({ length: limit }, () => runNext()));
}

async function main() {
  await ensureBucket();

  const allRows = await sql<{ dataset_id: string; image_path: string; gif_path: string }[]>`
    select dataset_id, image_path, gif_path from exercises order by dataset_id
  `;
  const rows: { dataset_id: string; image_path: string; gif_path: string }[] = LIMIT
    ? allRows.slice(0, LIMIT)
    : allRows;

  const paths = rows.flatMap((r) => [r.image_path, r.gif_path]);
  console.log(`${rows.length} ejercicios, ${paths.length} archivos a procesar...`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let done = 0;

  await runWithConcurrency(paths, CONCURRENCY, async (path) => {
    const result = await uploadPath(path);
    if (result === "uploaded") uploaded++;
    else if (result === "skipped") skipped++;
    else failed++;
    done++;
    if (done % 50 === 0 || done === paths.length) {
      console.log(`  ${done}/${paths.length} (subidos: ${uploaded}, saltados: ${skipped}, fallidos: ${failed})`);
    }
  });

  console.log(`Listo. Subidos: ${uploaded}, saltados: ${skipped}, fallidos: ${failed}.`);
  await sql.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
