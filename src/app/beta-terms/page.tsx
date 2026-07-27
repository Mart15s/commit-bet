import { LegalPage } from "@/components/legal-page";

export default function BetaTermsPage() {
  return (
    <LegalPage
      title="Beta Terms"
      summary="CommitBet is an experimental public beta provided free during product validation."
    >
      <section><h2>Beta status</h2><p>Features may change, contain errors, or be temporarily unavailable. Do not rely on CommitBet for emergency, legal, employment, medical, or financial decisions.</p></section>
      <section><h2>No real money</h2><p>CommitBet does not accept, hold, transfer, distribute, or automatically allocate real pledge money. Virtual commitment points have no monetary value and are not redeemable.</p></section>
      <section><h2>Human responsibility</h2><p>Users must inspect evidence and confirm task reviews, dispute resolutions, and final project outcomes themselves. AI recommendations never create an automatic penalty or payout.</p></section>
      <section><h2>Acceptable use</h2><p>Do not upload unlawful, malicious, executable, deceptive, or rights-infringing content. Do not attempt to access another team’s data or bypass application limits.</p></section>
      <section><h2>Your content</h2><p>You are responsible for having permission to upload and share project material with your team. Avoid uploading secrets or sensitive personal data that are not needed for accountability.</p></section>
    </LegalPage>
  );
}
