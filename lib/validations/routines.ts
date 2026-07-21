import { z } from "zod";

type T = (key: string) => string;

export function routineSchema(t: T) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(100, t("nameTooLong")),
    notes: z.string().trim().max(500, t("notesTooLong")).optional().or(z.literal("")),
  });
}
