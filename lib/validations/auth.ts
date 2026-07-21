import { z } from "zod";

// t = getTranslations("auth.validation") en el server action que arma el schema.
type T = (key: string) => string;

export function loginSchema(t: T) {
  return z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export function signupSchema(t: T) {
  return z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(8, t("passwordMin")),
  });
}
