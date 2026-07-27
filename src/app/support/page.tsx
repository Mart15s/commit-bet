import { LegalPage } from "@/components/legal-page";

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <LegalPage
      title="Support, abuse, and data requests"
      summary="Use this channel for product help, unsafe content reports, account deletion help, or a data export request."
    >
      {supportEmail ? (
        <section><h2>Contact</h2><p><a className="font-black text-primary" href={`mailto:${supportEmail}`}>{supportEmail}</a></p></section>
      ) : (
        <section><h2>Contact pending configuration</h2><p>The beta owner has not configured NEXT_PUBLIC_SUPPORT_EMAIL yet. No legal identity or address is invented here.</p></section>
      )}
      <section><h2>What to include</h2><p>Describe the issue and provide the relevant project or task ID. Do not email passwords, API keys, or unnecessary evidence contents.</p></section>
      <section><h2>Urgent safety</h2><p>CommitBet is not an emergency service. Contact the appropriate local authority or emergency service for immediate danger.</p></section>
    </LegalPage>
  );
}
