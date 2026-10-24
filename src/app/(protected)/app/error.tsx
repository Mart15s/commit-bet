"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button, ButtonLink, Card } from "@/components/ui";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useI18n();
  const lt = language === "lt";
  return (
    <Card className="mx-auto my-8 max-w-lg p-7">
      <AlertCircle className="mb-5 text-muted-foreground" size={28} aria-hidden="true" />
      <h1 className="text-2xl font-semibold">{lt ? "Nepavyko įkelti darbo aplinkos" : "The workspace couldn’t load"}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{lt ? "Bandykite dar kartą. Rodyti nepavykusių duomenų nepakeisime tuščiais rezultatais." : "Try again to load your data. Unavailable records won’t be shown as empty results."}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}><RotateCcw size={16} aria-hidden="true" />{lt ? "Bandyti dar kartą" : "Try again"}</Button>
        <ButtonLink href="/app" variant="secondary">{lt ? "Į darbo aplinką" : "Workspace"}</ButtonLink>
      </div>
    </Card>
  );
}
