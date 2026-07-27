import { LegalPage } from "@/components/legal-page";

export default function AINoticePage() {
  return (
    <LegalPage
      title="AI Notice"
      summary="CommitBet uses Google Gemini for planning and explainable recommendations. AI can be wrong."
    >
      <section><h2>What Gemini does</h2><p>Gemini can propose a project plan, compare evidence context with task criteria, structure a dispute, and draft a final project audit.</p></section>
      <section><h2>What Gemini receives</h2><p>Depending on the feature: project goals and criteria, member capabilities and availability, task details, evidence descriptions and safe metadata, explicitly extracted text, daily logs, review history, and disputes belonging to the current project.</p></section>
      <section><h2>What Gemini does not do</h2><p>Gemini does not automatically approve tasks, resolve disputes, finalize projects, or change virtual pledges. It does not inspect a file merely because a filename or storage record exists.</p></section>
      <section><h2>Prompt-injection protection</h2><p>User-provided evidence and links are treated as untrusted data. Instructions inside evidence are not product commands. Users must still check the source evidence before acting.</p></section>
      <section><h2>Human override</h2><p>A human reviewer may disagree with every AI output. The UI records human decisions separately from recommendations.</p></section>
    </LegalPage>
  );
}
