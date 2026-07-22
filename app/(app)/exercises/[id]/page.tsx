import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getExerciseById } from "@/lib/db/queries/exercises";
import { exerciseMediaUrl } from "@/lib/media";
import type { Locale } from "@/i18n/request";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("exercises");
  const tDetail = await getTranslations("exercises.detail");
  const tBodyParts = await getTranslations("exercises.bodyParts");
  const tEquipment = await getTranslations("exercises.equipment");

  const steps = exercise.instructionSteps[locale];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <Link href="/exercises" className="text-sm font-medium text-accent underline">
        ← {tDetail("back")}
      </Link>

      <h1 className="text-2xl font-extrabold capitalize tracking-tight">
        {exercise.name}
      </h1>

      {/* GIF sin optimizar: preserva la animación */}
      <img
        src={exerciseMediaUrl(exercise.gifPath)}
        alt={exercise.name}
        width={180}
        height={180}
        className="mx-auto aspect-square rounded-2xl border border-border bg-surface object-cover"
      />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">{t("bodyPartLabel")}</dt>
          <dd className="font-medium">{tBodyParts(exercise.bodyPart)}</dd>
        </div>
        <div>
          <dt className="text-muted">{tDetail("targetLabel")}</dt>
          <dd className="font-medium capitalize">{exercise.target}</dd>
        </div>
        <div>
          <dt className="text-muted">{tDetail("muscleGroupLabel")}</dt>
          <dd className="font-medium capitalize">{exercise.muscleGroup}</dd>
        </div>
        <div>
          <dt className="text-muted">{tDetail("equipmentLabel")}</dt>
          <dd className="font-medium">{tEquipment(exercise.equipment)}</dd>
        </div>
        {exercise.secondaryMuscles.length > 0 && (
          <div className="col-span-2">
            <dt className="text-muted">{tDetail("secondaryMusclesLabel")}</dt>
            <dd className="font-medium capitalize">
              {exercise.secondaryMuscles.join(", ")}
            </dd>
          </div>
        )}
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="font-extrabold tracking-tight">{tDetail("instructionsLabel")}</h2>
        <ol className="flex flex-col gap-2 text-sm">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-2">
              <span className="font-black text-accent">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-muted">{exercise.attribution}</p>
    </main>
  );
}
