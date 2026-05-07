/**
 * Shared display formatters used across all tabs.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatTodayDate(now: Date = new Date()): string {
  return `${WEEKDAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

/**
 * Short encouraging phrases shown after the user's name in the tab
 * header (e.g. "Hey, Dylan. You got this."). One is picked per browser
 * session and stays uniform across every tab for that session — see
 * RotatingPhrase for the storage logic.
 */
export const GREETING_PHRASES: readonly string[] = [
  "You got this.",
  "Let's go.",
  "Stay locked in.",
  "Show up.",
  "Earn it today.",
  "Trust the process.",
  "Make today count.",
  "Pressure is privilege.",
  "Strong is built daily.",
  "One more rep.",
  "Discipline > motivation.",
  "Hard work, quietly.",
];
