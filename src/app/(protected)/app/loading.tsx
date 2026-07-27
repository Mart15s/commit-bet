export default function AppLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div className="h-36 animate-pulse rounded-2xl border border-border bg-card" key={item} />)}
      </div>
      <span className="sr-only">Loading CommitBet…</span>
    </main>
  );
}
