import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Notice"
      summary="This notice explains the data CommitBet needs to run accountability sprints during the public beta."
    >
      <section><h2>Data we process</h2><p>Account details, team and project setup, task activity, daily logs, evidence descriptions and files, peer reviews, disputes, and final decisions.</p></section>
      <section><h2>Why we process it</h2><p>To authenticate users, isolate team data, run the accountability workflow, generate advisory Gemini recommendations, prevent abuse, and diagnose service failures.</p></section>
      <section><h2>Evidence and AI</h2><p>Evidence is private to authorized project members. Gemini receives the project context described in the AI Notice. The interface states when only metadata or descriptions—not file contents—were reviewed.</p></section>
      <section><h2>Service providers</h2><p>CommitBet uses Supabase for authentication, database, and private file storage; Vercel for application hosting; and Google Gemini for AI recommendations.</p></section>
      <section><h2>Your controls</h2><p>You can delete eligible evidence, request account deletion, and request a data export through the support channel. Some finalized audit records may need to be preserved in pseudonymized form to protect other team members’ accountability history.</p></section>
      <section><h2>Missing owner details</h2><p>The beta owner’s legal identity, postal address, and a formal retention schedule are not configured in the product yet. Contact details are shown on the Support page when configured.</p></section>
    </LegalPage>
  );
}
