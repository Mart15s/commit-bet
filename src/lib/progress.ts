export function projectProgress(tasks: Array<{ status: string }>) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "approved").length / tasks.length) * 100);
}

export function validateReturnPercentage(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

