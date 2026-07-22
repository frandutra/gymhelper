"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { logSetAction } from "@/app/(app)/workout/actions";
import { displayWeight, toKg, type WeightUnit } from "@/lib/workout/units";

const REPS_STEP = 1;
const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };

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
  defaultWeightKg,
  defaultReps,
  unit,
}: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  defaultWeightKg: number;
  defaultReps: number;
  unit: WeightUnit;
}) {
  const t = useTranslations("workout");
  // El estado local vive en la unidad de presentación (steps redondos, sin
  // arrastrar errores de redondeo); solo se convierte a kg al guardar.
  const [weight, setWeight] = useState(() => displayWeight(defaultWeightKg, unit));
  const [reps, setReps] = useState(defaultReps);
  const [isPending, startTransition] = useTransition();
  const weightStep = WEIGHT_STEP[unit];

  function handleLog() {
    startTransition(async () => {
      await logSetAction({
        sessionId,
        exerciseId,
        setNumber,
        weightKg: toKg(weight, unit),
        reps,
      });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3">
      <p className="text-sm font-medium text-muted">{t("setNumber", { number: setNumber })}</p>
      <div className="flex items-center justify-between gap-2">
        <Stepper
          label={t("weightLabel", { unit })}
          value={weight}
          onDecrement={() => setWeight((w) => Math.max(0, w - weightStep))}
          onIncrement={() => setWeight((w) => w + weightStep)}
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
