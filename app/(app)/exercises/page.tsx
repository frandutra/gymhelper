import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ExerciseFilters } from "@/components/features/exercise-filters";
import {
  isValidBodyPart,
  listEquipmentOptions,
  listExercises,
} from "@/lib/db/queries/exercises";
import { bodyPart } from "@/lib/db/schema";
import { exerciseMediaUrl } from "@/lib/media";

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(params: SearchParams, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const v = first(value);
    if (v) usp.set(key, v);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/exercises?${qs}` : "/exercises";
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = first(params.q);
  const bodyPartParam = first(params.bodyPart);
  const equipmentFilter = first(params.equipment);
  const bodyPartFilter =
    bodyPartParam && isValidBodyPart(bodyPartParam) ? bodyPartParam : undefined;
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [t, { rows, total }, equipmentOptions] = await Promise.all([
    getTranslations("exercises"),
    listExercises({
      query,
      bodyPart: bodyPartFilter,
      equipment: equipmentFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    listEquipmentOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      <ExerciseFilters bodyParts={bodyPart.enumValues} equipmentOptions={equipmentOptions} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t("noResults")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {rows.map((ex) => (
            <li key={ex.id}>
              <Link
                href={`/exercises/${ex.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2"
              >
                <Image
                  src={exerciseMediaUrl(ex.imagePath)}
                  alt={ex.name}
                  width={160}
                  height={160}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <span className="text-sm font-medium capitalize">{ex.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          {page > 1 ? (
            <Link href={buildHref(params, page - 1)}>{t("prev")}</Link>
          ) : (
            <span className="opacity-40">{t("prev")}</span>
          )}
          <span>{t("pageOf", { page, totalPages })}</span>
          {page < totalPages ? (
            <Link href={buildHref(params, page + 1)}>{t("next")}</Link>
          ) : (
            <span className="opacity-40">{t("next")}</span>
          )}
        </div>
      )}
    </main>
  );
}
