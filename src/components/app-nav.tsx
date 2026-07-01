"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FolderKanban, Home, PlusCircle, ScrollText, UserRound, Users } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export const navLinks = [
  { href: "/app", labelKey: "nav.home", icon: Home, active: ["/app"] },
  { href: "/projects", labelKey: "nav.projects", icon: FolderKanban, active: ["/projects", "/app/projects"], exclude: ["/app/projects/new"] },
  { href: "/app/teams", labelKey: "nav.team", icon: Users },
  { href: "/app/projects/new", labelKey: "nav.create", icon: PlusCircle },
  { href: "/app/approvals", labelKey: "nav.review", icon: ClipboardCheck },
  { href: "/app/logs/new", labelKey: "nav.log", icon: ScrollText },
  { href: "/app/profile", labelKey: "nav.profile", icon: UserRound },
];

function isActiveLink(pathname: string, link: (typeof navLinks)[number]) {
  if (link.exclude?.some((prefix) => pathname.startsWith(prefix))) return false;
  if (link.href === "/app") return pathname === "/app";
  const activePaths = link.active ?? [link.href];
  return activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppNav({
  profile,
}: {
  profile?: {
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const accountLabel = profile?.name || profile?.email || t("nav.account");

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/85 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/app" className="text-xl font-black tracking-[-.03em] text-foreground">{t("app.brand")}</Link>
          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const active = isActiveLink(pathname, link);
              return (
                <Link
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                    active && "bg-primary/12 text-foreground ring-1 ring-primary/20",
                  )}
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                >
                  {t(link.labelKey)}
                </Link>
              );
            })}
            <LanguageSwitcher compact persistToProfile className="ml-1" labelClassName="sr-only" />
            <Link className="ml-1 flex max-w-44 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-foreground hover:bg-elevated" href="/app/profile">
              <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-primary/25 bg-primary/10 text-primary">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-cover" src={profile.avatar_url} />
                ) : (
                  <UserRound size={16} />
                )}
              </span>
              <span className="truncate">{accountLabel}</span>
            </Link>
            <LogoutButton variant="ghost" size="sm" />
          </nav>
        </div>
      </header>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/app" className="text-lg font-black tracking-[-.03em] text-foreground">{t("app.brand")}</Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact persistToProfile labelClassName="sr-only" />
            <LogoutButton size="sm" variant="secondary" showIcon={false} />
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-border bg-surface/95 px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActiveLink(pathname, link);
          return (
            <Link
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-black text-muted-foreground hover:text-primary",
                active && "bg-primary/12 text-primary",
              )}
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} /><span className="max-w-full truncate">{t(link.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
