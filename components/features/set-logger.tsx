"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { logSetAction } from "@/app/(app)/workout/actions";

const WEIGHT_STEP = 2.5;
const REPS_STEP = 1;

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold text-foreground"
        >
          −
        </button>
        <span className="w-14 text-center text-2xl font-black tabular-nums text-accent">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SetLogger({
  sessionId,
  exerciseId,
  setNumber,
  defaultWeight,
  defaultReps,
}: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  defaultWeight: number;
  defaultReps: number;
}) {
  const t = useTranslations("workout");
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [isPending, startTransition] = useTransition();

  function handleLog() {
    startTransition(async () => {
      await logSetAction({ sessionId, exerciseId, setNumber, weightKg: weight, reps });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3">
      <p className="text-sm font-medium text-muted">{t("setNumber", { number: setNumber })}</p>
      <div className="flex items-center justify-between gap-2">
        <Stepper
          label={t("weightLabel")}
          value={weight}
          onDecrement={() => setWeight((w) => Math.max(0, w - WEIGHT_STEP))}
          onIncrement={() => setWeight((w) => w + WEIGHT_STEP)}
        />
        <Stepper
          label={t("repsLabel")}
          value={reps}
          onDecrement={() => setReps((r) => Math.max(0, r - REPS_STEP))}
          onIncrement={() => setReps((r) => r + REPS_STEP)}
        />
      </div>
      <button
        type="button"
        onClick={handleLog}
        disabled={isPending}
        className="h-11 rounded-xl bg-accent px-4 font-semibold text-accent-foreground disabled:opacity-50"
      >
        {isPending ? t("logging") : t("logSet")}
      </button>
    </div>
  );
}
