import { z } from "zod";

type T = (key: string) => string;

export function routineExerciseSchema(t: T) {
  return z.object({
    targetSets: z.coerce.number().int().min(1, t("setsMin")).max(20, t("setsMax")),
    targetReps: z.string().trim().min(1, t("repsRequired")).max(20, t("repsTooLong")),
    restSeconds: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().int().min(0, t("restMin")).max(600, t("restMax")).optional(),
    ),
    notes: z.string().trim().max(300, t("notesTooLong")).optional().or(z.literal("")),
  });
}
