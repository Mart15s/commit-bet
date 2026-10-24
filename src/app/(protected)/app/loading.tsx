export default function WorkspaceLoading() {
  return (
    <div role="status" aria-label="Loading / Kraunama" className="space-y-6 py-2">
      <span className="sr-only">Loading / Kraunama…</span>
      <div className="h-3 w-28 rounded bg-elevated" />
      <div className="h-9 w-3/4 max-w-md rounded bg-elevated" />
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl border border-border bg-card" />)}
      </div>
      <div className="h-60 rounded-2xl border border-border bg-card" aria-hidden="true" />
    </div>
  );
}
