/** Marketing-only fixture. Never import this into an authenticated workspace. */
export const exampleSprint = {
  duration: 14,
  currentDay: 10,
  tasks: [
    { id: "scope", en: "Agree on the release scope", lt: "Sutarti dėl leidimo apimties", submittedDay: 2, reviewedDay: 4 },
    { id: "design", en: "Build the signup experience", lt: "Sukurti registracijos patirtį", submittedDay: 5, reviewedDay: 6 },
    { id: "mobile", en: "Validate the mobile flow", lt: "Patikrinti mobiliąją versiją", submittedDay: 6, reviewedDay: 9 },
    { id: "demo", en: "Publish the working demo", lt: "Paskelbti veikiančią demonstraciją", submittedDay: 8, reviewedDay: null },
    { id: "handoff", en: "Document the handoff", lt: "Parengti perdavimo dokumentą", submittedDay: 9, reviewedDay: null },
    { id: "release", en: "Prepare the final release", lt: "Parengti galutinį leidimą", submittedDay: null, reviewedDay: null },
  ],
} as const;

export function getExampleSprintMetrics(day = exampleSprint.currentDay as number) {
  const submitted = exampleSprint.tasks.filter((task) => task.submittedDay !== null && task.submittedDay <= day).length;
  const verified = exampleSprint.tasks.filter((task) => task.reviewedDay !== null && task.reviewedDay <= day).length;
  return { total: exampleSprint.tasks.length, submitted, verified, pending: submitted - verified, percent: Math.round(verified / exampleSprint.tasks.length * 100) };
}
