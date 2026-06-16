export const demoMembers = [
  { name: "Maya Chen", shortName: "Maya", role: "Product design", availability: "3h/day", score: 92, color: "blue" },
  { name: "Jon Bell", shortName: "Jon", role: "Engineering", availability: "4h/day", score: 84, color: "cyan" },
  { name: "Alex Rivera", shortName: "Alex", role: "Product strategy", availability: "2h/day", score: 88, color: "purple" },
] as const;

export const demoTasks = [
  { title: "Record product walkthrough", status: "in_progress", proof: "Demo video", due: "6:00 PM" },
  { title: "Complete onboarding copy", status: "submitted", proof: "Docs", due: "4:30 PM" },
  { title: "Publish landing page", status: "todo", proof: "Live URL", due: "Tomorrow" },
] as const;

export const demoTimeline = [
  {
    dateRange: "Day 1-2",
    owner: "Alex",
    title: "Align scope",
    expectedProof: "Decision log",
    risk: "Medium",
    status: "approved",
  },
  {
    dateRange: "Day 3-6",
    owner: "Maya",
    title: "Build core experience",
    expectedProof: "Figma + GitHub",
    risk: "Low",
    status: "in_progress",
  },
  {
    dateRange: "Day 7-10",
    owner: "Jon",
    title: "Integrate and test",
    expectedProof: "Demo + commits",
    risk: "Medium",
    status: "todo",
  },
  {
    dateRange: "Day 11-14",
    owner: "Team",
    title: "Polish and launch",
    expectedProof: "Live URL",
    risk: "Low",
    status: "todo",
  },
] as const;

export const acceptanceCriteria = [
  { label: "Workspace creation flow is complete", status: "met" },
  { label: "Desktop and mobile states included", status: "met" },
  { label: "Error states are documented", status: "unclear" },
] as const;

export const recentProof = [
  { source: "Figma", title: "Onboarding prototype", meta: "12 frames · Updated 2h ago", description: "Complete workspace setup flow with responsive states." },
  { source: "Video", title: "Product walkthrough", meta: "3:42 · Verified yesterday", description: "Recorded walkthrough covering the primary success criteria." },
  { source: "Docs", title: "Landing copy document", meta: "1,240 words · Reviewed", description: "Final positioning, onboarding copy, and launch messaging." },
] as const;

export const flowSteps = [
  ["01", "Commit", "Define outcome and meaningful stake."],
  ["02", "AI Plan", "Turn intent into daily accountable work."],
  ["03", "Daily Proof", "Make progress visible in under two minutes."],
  ["04", "Peer Review", "Approve against explicit criteria."],
  ["05", "Final Report", "Close with an auditable outcome."],
] as const;
