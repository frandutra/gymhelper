/**
 * Lógica pura del dominio de entrenamiento (sin I/O). Ver CLAUDE.md.
 */

/** Extrae el primer número de un rango de reps libre ("8-12" -> 8, "10" -> 10). */
export function parseDefaultReps(targetReps: string, fallback = 10): number {
  const match = targetReps.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}
