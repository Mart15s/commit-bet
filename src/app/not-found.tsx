import { ButtonLink, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-16">
      <Card className="text-center">
        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">404</p>
        <h1 className="mt-3 text-3xl font-black">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page may have moved, or you may not have access to it.</p>
        <ButtonLink className="mt-6" href="/app">Go to dashboard</ButtonLink>
      </Card>
    </main>
  );
}
