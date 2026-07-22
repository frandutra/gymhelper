/**
 * Conversión de unidades de peso. Lógica pura (sin I/O) — ver CLAUDE.md.
 * La base de datos siempre guarda kg; esto es solo para presentación.
 */

export type WeightUnit = "kg" | "lb";

const KG_TO_LB = 2.2046226218;

export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / KG_TO_LB) * 10) / 10;
}

/** Convierte un peso en kg (como se guarda) a la unidad de presentación. */
export function displayWeight(weightKg: number, unit: WeightUnit): number {
  return unit === "kg" ? weightKg : kgToLb(weightKg);
}

/** Convierte un peso ingresado en la unidad de presentación de vuelta a kg. */
export function toKg(weight: number, unit: WeightUnit): number {
  return unit === "kg" ? weight : lbToKg(weight);
}
