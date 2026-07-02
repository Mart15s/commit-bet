export type ChipOption = {
  value: string;
  labelKey: string;
  recommended?: boolean;
};

export const roleOptions: ChipOption[] = [
  { value: "Software Development", labelKey: "onboarding.roles.softwareDevelopment", recommended: true },
  { value: "Frontend", labelKey: "onboarding.roles.frontend" },
  { value: "Backend", labelKey: "onboarding.roles.backend" },
  { value: "Full-stack", labelKey: "onboarding.roles.fullStack", recommended: true },
  { value: "UI/UX Design", labelKey: "onboarding.roles.uiUxDesign" },
  { value: "Product Design", labelKey: "onboarding.roles.productDesign" },
  { value: "Marketing", labelKey: "onboarding.roles.marketing", recommended: true },
  { value: "Social Media", labelKey: "onboarding.roles.socialMedia" },
  { value: "Content Creation", labelKey: "onboarding.roles.contentCreation" },
  { value: "Copywriting", labelKey: "onboarding.roles.copywriting" },
  { value: "Sales", labelKey: "onboarding.roles.sales" },
  { value: "Business", labelKey: "onboarding.roles.business" },
  { value: "Strategy", labelKey: "onboarding.roles.strategy" },
  { value: "Project Management", labelKey: "onboarding.roles.projectManagement" },
  { value: "Research", labelKey: "onboarding.roles.research" },
  { value: "Data Analysis", labelKey: "onboarding.roles.dataAnalysis" },
  { value: "AI / Automation", labelKey: "onboarding.roles.aiAutomation", recommended: true },
  { value: "Customer Support", labelKey: "onboarding.roles.customerSupport" },
  { value: "Operations", labelKey: "onboarding.roles.operations" },
  { value: "Finance", labelKey: "onboarding.roles.finance" },
  { value: "Legal", labelKey: "onboarding.roles.legal" },
  { value: "Other", labelKey: "common.other" },
];

export const strengthOptions: ChipOption[] = [
  { value: "Programming", labelKey: "onboarding.skills.programming", recommended: true },
  { value: "Debugging", labelKey: "onboarding.skills.debugging" },
  { value: "System architecture", labelKey: "onboarding.skills.systemArchitecture" },
  { value: "API integration", labelKey: "onboarding.skills.apiIntegration" },
  { value: "Database design", labelKey: "onboarding.skills.databaseDesign" },
  { value: "UI design", labelKey: "onboarding.skills.uiDesign" },
  { value: "UX thinking", labelKey: "onboarding.skills.uxThinking" },
  { value: "Branding", labelKey: "onboarding.skills.branding" },
  { value: "Copywriting", labelKey: "onboarding.skills.copywriting" },
  { value: "Social media content", labelKey: "onboarding.skills.socialMediaContent" },
  { value: "Short-form video", labelKey: "onboarding.skills.shortFormVideo" },
  { value: "Paid ads", labelKey: "onboarding.skills.paidAds" },
  { value: "SEO", labelKey: "onboarding.skills.seo" },
  { value: "Landing pages", labelKey: "onboarding.skills.landingPages", recommended: true },
  { value: "Sales outreach", labelKey: "onboarding.skills.salesOutreach" },
  { value: "Market research", labelKey: "onboarding.skills.marketResearch" },
  { value: "Business planning", labelKey: "onboarding.skills.businessPlanning" },
  { value: "Pitching", labelKey: "onboarding.skills.pitching" },
  { value: "Documentation", labelKey: "onboarding.skills.documentation" },
  { value: "Organizing tasks", labelKey: "onboarding.skills.organizingTasks", recommended: true },
  { value: "Testing", labelKey: "onboarding.skills.testing" },
  { value: "Analytics", labelKey: "onboarding.skills.analytics" },
  { value: "AI prompting", labelKey: "onboarding.skills.aiPrompting", recommended: true },
  { value: "Automation", labelKey: "onboarding.skills.automation" },
  { value: "Communication", labelKey: "onboarding.skills.communication" },
  { value: "Leadership", labelKey: "onboarding.skills.leadership" },
];

export const weaknessOptions: ChipOption[] = [
  { value: "Programming", labelKey: "onboarding.skills.programming" },
  { value: "Design", labelKey: "onboarding.weaknesses.design" },
  { value: "Marketing", labelKey: "onboarding.roles.marketing" },
  { value: "Sales", labelKey: "onboarding.roles.sales" },
  { value: "Writing", labelKey: "onboarding.weaknesses.writing" },
  { value: "Public speaking", labelKey: "onboarding.weaknesses.publicSpeaking" },
  { value: "Planning", labelKey: "onboarding.weaknesses.planning" },
  { value: "Research", labelKey: "onboarding.roles.research" },
  { value: "Technical setup", labelKey: "onboarding.weaknesses.technicalSetup" },
  { value: "Analytics", labelKey: "onboarding.skills.analytics" },
  { value: "Documentation", labelKey: "onboarding.skills.documentation" },
  { value: "Repetitive tasks", labelKey: "onboarding.weaknesses.repetitiveTasks" },
  { value: "Client communication", labelKey: "onboarding.weaknesses.clientCommunication" },
  { value: "Time management", labelKey: "onboarding.weaknesses.timeManagement" },
  { value: "Detail work", labelKey: "onboarding.weaknesses.detailWork" },
  { value: "Visual design", labelKey: "onboarding.weaknesses.visualDesign" },
  { value: "Backend work", labelKey: "onboarding.weaknesses.backendWork" },
  { value: "Frontend work", labelKey: "onboarding.weaknesses.frontendWork" },
  { value: "Social media", labelKey: "onboarding.roles.socialMedia" },
  { value: "Business strategy", labelKey: "onboarding.weaknesses.businessStrategy" },
];

export const preferredWorkTypeOptions: ChipOption[] = [
  { value: "Building features", labelKey: "onboarding.workTypes.buildingFeatures", recommended: true },
  { value: "Fixing bugs", labelKey: "onboarding.workTypes.fixingBugs" },
  { value: "Designing screens", labelKey: "onboarding.workTypes.designingScreens" },
  { value: "Writing content", labelKey: "onboarding.workTypes.writingContent" },
  { value: "Creating social posts", labelKey: "onboarding.workTypes.creatingSocialPosts" },
  { value: "Planning tasks", labelKey: "onboarding.workTypes.planningTasks", recommended: true },
  { value: "Researching users", labelKey: "onboarding.workTypes.researchingUsers" },
  { value: "Talking to customers", labelKey: "onboarding.workTypes.talkingToCustomers" },
  { value: "Testing product", labelKey: "onboarding.workTypes.testingProduct" },
  { value: "Writing documentation", labelKey: "onboarding.workTypes.writingDocumentation" },
  { value: "Setting up tools", labelKey: "onboarding.workTypes.settingUpTools" },
  { value: "Making presentations", labelKey: "onboarding.workTypes.makingPresentations" },
  { value: "Recording videos", labelKey: "onboarding.workTypes.recordingVideos" },
  { value: "Reviewing work", labelKey: "onboarding.workTypes.reviewingWork" },
  { value: "Managing project", labelKey: "onboarding.workTypes.managingProject" },
  { value: "Analyzing data", labelKey: "onboarding.workTypes.analyzingData" },
];

export const evidenceTypeOptions: ChipOption[] = [
  { value: "GitHub commits", labelKey: "onboarding.evidence.githubCommits", recommended: true },
  { value: "Pull requests", labelKey: "onboarding.evidence.pullRequests" },
  { value: "Screenshots", labelKey: "onboarding.evidence.screenshots", recommended: true },
  { value: "Screen recording", labelKey: "onboarding.evidence.screenRecording" },
  { value: "Demo video", labelKey: "onboarding.evidence.demoVideo" },
  { value: "Live demo URL", labelKey: "onboarding.evidence.liveDemoUrl", recommended: true },
  { value: "Deployment link", labelKey: "onboarding.evidence.deploymentLink" },
  { value: "Figma link", labelKey: "onboarding.evidence.figmaLink" },
  { value: "Google Docs link", labelKey: "onboarding.evidence.googleDocsLink" },
  { value: "Notion link", labelKey: "onboarding.evidence.notionLink" },
  { value: "Uploaded file", labelKey: "onboarding.evidence.uploadedFile" },
  { value: "Written summary", labelKey: "onboarding.evidence.writtenSummary" },
  { value: "Analytics screenshot", labelKey: "onboarding.evidence.analyticsScreenshot" },
  { value: "Customer messages", labelKey: "onboarding.evidence.customerMessages" },
  { value: "Test results", labelKey: "onboarding.evidence.testResults" },
];

export const availabilityOptions = [
  { value: "15", minutes: 15, labelKey: "onboarding.availability.15" },
  { value: "30", minutes: 30, labelKey: "onboarding.availability.30", recommended: true },
  { value: "60", minutes: 60, labelKey: "onboarding.availability.60", recommended: true },
  { value: "120", minutes: 120, labelKey: "onboarding.availability.120" },
  { value: "180", minutes: 180, labelKey: "onboarding.availability.180" },
  { value: "240", minutes: 240, labelKey: "onboarding.availability.240" },
] as const;

export const experienceLevelOptions: ChipOption[] = [
  { value: "Beginner", labelKey: "onboarding.experience.beginner", recommended: true },
  { value: "Intermediate", labelKey: "onboarding.experience.intermediate" },
  { value: "Advanced", labelKey: "onboarding.experience.advanced" },
  { value: "Expert", labelKey: "onboarding.experience.expert" },
];

export const bestWorkTimeOptions: ChipOption[] = [
  { value: "Morning", labelKey: "onboarding.workTime.morning" },
  { value: "Afternoon", labelKey: "onboarding.workTime.afternoon" },
  { value: "Evening", labelKey: "onboarding.workTime.evening", recommended: true },
  { value: "Late night", labelKey: "onboarding.workTime.lateNight" },
  { value: "Weekends only", labelKey: "onboarding.workTime.weekendsOnly" },
  { value: "Flexible", labelKey: "onboarding.workTime.flexible", recommended: true },
];

export const projectTypeOptions: ChipOption[] = [
  { value: "MVP / Startup project", labelKey: "onboarding.projectTypes.mvpStartup", recommended: true },
  { value: "Landing page", labelKey: "onboarding.projectTypes.landingPage", recommended: true },
  { value: "Mobile app", labelKey: "onboarding.projectTypes.mobileApp" },
  { value: "Web app", labelKey: "onboarding.projectTypes.webApp", recommended: true },
  { value: "Marketing campaign", labelKey: "onboarding.projectTypes.marketingCampaign" },
  { value: "Content sprint", labelKey: "onboarding.projectTypes.contentSprint" },
  { value: "School / university project", labelKey: "onboarding.projectTypes.schoolUniversity" },
  { value: "Hackathon project", labelKey: "onboarding.projectTypes.hackathon" },
  { value: "Business validation", labelKey: "onboarding.projectTypes.businessValidation" },
  { value: "Research project", labelKey: "onboarding.projectTypes.researchProject" },
  { value: "Design sprint", labelKey: "onboarding.projectTypes.designSprint" },
  { value: "Sales sprint", labelKey: "onboarding.projectTypes.salesSprint" },
  { value: "Other", labelKey: "common.other" },
];

export const durationOptions = [
  { value: "7", labelKey: "onboarding.duration.7" },
  { value: "14", labelKey: "onboarding.duration.14", recommended: true },
  { value: "30", labelKey: "onboarding.duration.30" },
] as const;

export const pledgeAmountOptions = [
  { value: "10", amount: 10, labelKey: "onboarding.pledge.10" },
  { value: "20", amount: 20, labelKey: "onboarding.pledge.20", recommended: true },
  { value: "50", amount: 50, labelKey: "onboarding.pledge.50" },
  { value: "100", amount: 100, labelKey: "onboarding.pledge.100" },
] as const;

export const successCriteriaTemplates: Record<string, ChipOption[]> = {
  "MVP / Startup project": [
    { value: "Working deployed version", labelKey: "onboarding.criteria.workingDeployedVersion", recommended: true },
    { value: "Authentication works", labelKey: "onboarding.criteria.authenticationWorks" },
    { value: "Main dashboard exists", labelKey: "onboarding.criteria.mainDashboardExists" },
    { value: "Core user flow works", labelKey: "onboarding.criteria.coreUserFlowWorks", recommended: true },
    { value: "Database stores required data", labelKey: "onboarding.criteria.databaseStoresRequiredData" },
    { value: "Demo video recorded", labelKey: "onboarding.criteria.demoVideoRecorded" },
    { value: "At least 5 test users invited", labelKey: "onboarding.criteria.fiveTestUsersInvited" },
  ],
  "Web app": [
    { value: "Working deployed version", labelKey: "onboarding.criteria.workingDeployedVersion", recommended: true },
    { value: "Authentication works", labelKey: "onboarding.criteria.authenticationWorks" },
    { value: "Main dashboard exists", labelKey: "onboarding.criteria.mainDashboardExists" },
    { value: "Core user flow works", labelKey: "onboarding.criteria.coreUserFlowWorks", recommended: true },
    { value: "Database stores required data", labelKey: "onboarding.criteria.databaseStoresRequiredData" },
    { value: "Demo video recorded", labelKey: "onboarding.criteria.demoVideoRecorded" },
    { value: "At least 5 test users invited", labelKey: "onboarding.criteria.fiveTestUsersInvited" },
  ],
  "Landing page": [
    { value: "Page is live", labelKey: "onboarding.criteria.pageIsLive", recommended: true },
    { value: "Main value proposition is clear", labelKey: "onboarding.criteria.valuePropClear" },
    { value: "Signup/waitlist form works", labelKey: "onboarding.criteria.signupFormWorks", recommended: true },
    { value: "Mobile layout works", labelKey: "onboarding.criteria.mobileLayoutWorks" },
    { value: "Analytics installed", labelKey: "onboarding.criteria.analyticsInstalled" },
    { value: "At least 3 sections completed", labelKey: "onboarding.criteria.threeSectionsCompleted" },
  ],
  "Marketing campaign": [
    { value: "Content calendar created", labelKey: "onboarding.criteria.contentCalendarCreated", recommended: true },
    { value: "At least 5 posts published", labelKey: "onboarding.criteria.fivePostsPublished" },
    { value: "Target audience defined", labelKey: "onboarding.criteria.targetAudienceDefined", recommended: true },
    { value: "Basic analytics reviewed", labelKey: "onboarding.criteria.basicAnalyticsReviewed" },
    { value: "Campaign results summarized", labelKey: "onboarding.criteria.campaignResultsSummarized" },
  ],
};

export function criteriaForProjectType(projectType: string) {
  return successCriteriaTemplates[projectType] ?? successCriteriaTemplates["MVP / Startup project"];
}
