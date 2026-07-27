import Link from "next/link";

export function TrustFooter() {
  return (
    <footer className="border-t border-border bg-surface/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-8">
        <p>
          Public beta · Virtual commitment points have no monetary value · Gemini outputs are advisory and require human review.
        </p>
        <nav aria-label="Trust and legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="font-bold text-foreground hover:text-primary" href="/privacy">Privacy Notice</Link>
          <Link className="font-bold text-foreground hover:text-primary" href="/beta-terms">Beta Terms</Link>
          <Link className="font-bold text-foreground hover:text-primary" href="/ai-notice">AI Notice</Link>
          <Link className="font-bold text-foreground hover:text-primary" href="/support">Support & reporting</Link>
        </nav>
      </div>
    </footer>
  );
}
