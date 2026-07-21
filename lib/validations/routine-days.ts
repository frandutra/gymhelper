import { z } from "zod";

type T = (key: string) => string;

export function routineDaySchema(t: T) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(50, t("nameTooLong")),
    weekday: z.enum(["", "0", "1", "2", "3", "4", "5", "6"]).optional(),
  });
}
