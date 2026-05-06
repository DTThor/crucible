/**
 * Unit conversions. Storage is always SI (ml, kg). Display is per-user
 * preference (defaulting to oz, lb).
 */

export const ML_PER_OZ = 29.5735296875;

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function mlToOzRounded(ml: number): number {
  return Math.round(mlToOz(ml));
}

/** Default daily water target. Editable later via profile settings. */
export const DEFAULT_WATER_TARGET_OZ = 64;

/** Quick-add buttons (oz). */
export const WATER_QUICK_ADDS_OZ = [8, 16, 24] as const;

/** lb ↔ kg helpers. */
export const KG_PER_LB = 0.45359237;

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}
