import Link from "next/link";
import { ClipboardCheck, Home, PlusCircle, ScrollText, Settings, Users } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui";
import { T, type TranslationKey } from "@/i18n/useTranslation";

const links = [
  { href: "/app", label: "nav.home", icon: Home },
  { href: "/app/teams", label: "nav.team", icon: Users },
  { href: "/app/projects/new", label: "nav.create", icon: PlusCircle },
  { href: "/app/approvals", label: "nav.review", icon: ClipboardCheck },
  { href: "/app/logs/new", label: "nav.log", icon: ScrollText },
];

const desktopLinks = [...links, { href: "/app/settings", label: "nav.settings", icon: Settings }];

export function AppNav() {
  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/85 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/app" className="text-xl font-black tracking-[-.03em] text-foreground">CommitBet</Link>
          <nav className="flex items-center gap-2">
            {desktopLinks.map(({ href, label }) => <Link className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-primary/10 hover:text-foreground" key={href} href={href}><T k={label as TranslationKey} /></Link>)}
            <LanguageSwitcher compact />
            <form action={logout}><Button type="submit" variant="ghost" size="sm"><T k="nav.logout" /></Button></form>
          </nav>
        </div>
      </header>
      <div className="fixed right-3 top-3 z-40 rounded-2xl border border-border bg-background/85 p-1 shadow-[0_10px_30px_rgba(0,0,0,.25)] backdrop-blur md:hidden">
        <LanguageSwitcher compact />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black text-muted-foreground hover:text-primary" key={href} href={href}>
            <Icon size={20} /><span><T k={label as TranslationKey} /></span>
          </Link>
        ))}
      </nav>
    </>
  );
}
