"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = {};

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          id="email"
          name="email"
          type="email"
          label={t("email")}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label={t("password")}
          autoComplete="current-password"
          required
        />

        {state.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? t("submitPending") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-foreground underline">
          {t("signupLink")}
        </Link>
      </p>
    </div>
  );
}
