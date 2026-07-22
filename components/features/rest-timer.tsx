"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function notifyDone() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Web Audio no disponible en este navegador; la vibración/aviso visual alcanza.
  }
}

/**
 * Timer opcional de descanso: arranca solo cuando `triggerKey` cambia
 * (una serie nueva logueada), nunca en el primer render (evita arrancar
 * solo por retomar la pantalla con series ya cargadas).
 */
export function RestTimer({
  restSeconds,
  triggerKey,
}: {
  restSeconds: number;
  triggerKey: string;
}) {
  const t = useTranslations("workout");
  const [remaining, setRemaining] = useState<number | null>(null);
  const isFirstRender = useRef(true);
  const prevKey = useRef(triggerKey);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevKey.current = triggerKey;
      return;
    }
    if (triggerKey !== prevKey.current) {
      prevKey.current = triggerKey;
      setRemaining(restSeconds);
    }
  }, [triggerKey, restSeconds]);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      notifyDone();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r !== null ? r - 1 : r)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  if (remaining === null) return null;

  const finished = remaining <= 0;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-3 ${
        finished ? "border-accent bg-accent/10" : "border-border bg-background"
      }`}
    >
      <span className="text-sm font-medium text-muted">
        {finished ? t("restDone") : t("resting")}
      </span>
      <span className="text-2xl font-black tabular-nums text-accent">
        {formatTime(Math.max(0, remaining))}
      </span>
      <button
        type="button"
        onClick={() => setRemaining(null)}
        className="text-sm font-medium text-muted underline"
      >
        {t("skipRest")}
      </button>
    </div>
  );
}
