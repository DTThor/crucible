"use server";

/**
 * Tiny wrapper module so client components can call the progression
 * query as a server action when the user picks a different exercise
 * from the dropdown. The query itself lives in history.ts (which can't
 * be imported directly into a client component because it uses the
 * Supabase server client).
 */
import {
  getExerciseProgression as serverGetExerciseProgression,
} from "./history";
import type { ExercisePoint } from "./history-utils";

export async function fetchExerciseProgression(
  exerciseSlug: string,
): Promise<ExercisePoint[]> {
  return serverGetExerciseProgression(exerciseSlug);
}
