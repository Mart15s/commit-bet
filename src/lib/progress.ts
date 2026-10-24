export function projectProgress(tasks: Array<{ status: string }>) {
  if (!tasks.length) return 0;
  return Math.round(
    (tasks.filter((task) => task.status === "approved").length / tasks.length) *
      100,
  );
}

/** Date-only values are interpreted as calendar dates, never as progress. */
export function sprintTime(start: string, end: string, today: string) {
  const parse = (value: string) => Date.parse(`${value}T00:00:00Z`);
  const [first, last, now] = [start, end, today].map(parse);
  if (![first, last, now].every(Number.isFinite) || last < first) return null;
  const total = Math.round((last - first) / 86_400_000) + 1;
  const elapsed = Math.max(
    0,
    Math.min(total, Math.floor((now - first) / 86_400_000)),
  );
  return {
    total,
    day: Math.max(0, Math.min(total, elapsed + 1)),
    elapsed: Math.round((elapsed / total) * 100),
    ended: now > last,
    upcoming: now < first,
  };
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validateReturnPercentage(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
