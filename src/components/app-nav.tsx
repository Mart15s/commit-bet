"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  ClipboardCheck,
  Home,
  Layers3,
  MoreHorizontal,
  PlusCircle,
  ScrollText,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export const primaryLinks = [
  { href: "/app", key: "nav.home", icon: Home },
  { href: "/app/projects", key: "nav.sprints", icon: Layers3 },
  { href: "/app/logs/new", key: "nav.logToday", icon: ScrollText },
  { href: "/app/approvals", key: "nav.reviews", icon: ClipboardCheck },
];
const moreLinks = [
  { href: "/app/teams", key: "nav.team", icon: Users },
  { href: "/app/projects/new", key: "dash.new", icon: PlusCircle },
  { href: "/app/profile", key: "nav.profile", icon: UserRound },
  { href: "/app/settings", key: "nav.settings", icon: Settings },
];

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
  const dialog = useRef<HTMLDialogElement>(null);
  const isActive = (href: string) =>
    href === "/app" ? pathname === href : pathname.startsWith(href);
  const moreActive = moreLinks
    .filter((link) => link.href !== "/app/projects/new")
    .some((link) => isActive(link.href));
  const moreButton = (mobile: boolean) => (
    <button
      type="button"
      aria-label={t("nav.more")}
      aria-haspopup="dialog"
      onClick={() => dialog.current?.showModal()}
      className={cn(
        "min-h-12 rounded-xl font-semibold",
        mobile
          ? "flex flex-col items-center justify-center gap-1 text-[11px]"
          : "inline-flex items-center gap-2 px-4 text-sm",
        moreActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-elevated hover:text-foreground",
      )}
    >
      <MoreHorizontal size={20} aria-hidden="true" />
      {t("nav.more")}
    </button>
  );
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:p-3 focus:text-primary-foreground"
        href="#main-content"
      >
        {t("nav.skip")}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardCheck size={19} aria-hidden="true" />
            </span>
            {t("app.brand")}
          </Link>
          <nav
            aria-label={t("nav.primary")}
            className="hidden items-center gap-1 lg:flex"
          >
            {primaryLinks.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold",
                  href === "/app/logs/new"
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : isActive(href)
                      ? "bg-elevated text-primary"
                      : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                )}
              >
                <Icon size={17} aria-hidden="true" />
                {t(key)}
              </Link>
            ))}
            {moreButton(false)}
          </nav>
          <span className="max-w-40 truncate text-xs text-muted-foreground">
            {profile?.name || t("dash.eyebrow")}
          </span>
        </div>
      </header>
      <nav
        aria-label={t("nav.primary")}
        className="fixed inset-x-0 bottom-0 z-40 grid h-[var(--mobile-nav-height)] grid-cols-5 items-start border-t border-border bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden"
      >
        {primaryLinks.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[10px] font-semibold sm:text-xs",
              href === "/app/logs/new"
                ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                : isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{t(key)}</span>
          </Link>
        ))}
        {moreButton(true)}
      </nav>
      <dialog
        ref={dialog}
        aria-labelledby="more-title"
        className="rounded-2xl border border-border bg-surface p-5 shadow-2xl"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="more-title" className="text-xl font-bold">
              {t("nav.more")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.name || profile?.email || t("nav.account")}
            </p>
          </div>
          <button
            autoFocus
            type="button"
            aria-label={t("nav.close")}
            onClick={() => dialog.current?.close()}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="grid gap-2" aria-label={t("nav.more")}>
          {moreLinks.map(({ href, key, icon: Icon }) => (
            <Link
              onClick={() => dialog.current?.close()}
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-elevated"
            >
              <Icon size={19} className="text-primary" />
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="mt-5 border-t border-border pt-4">
          <LanguageSwitcher compact persistToProfile />
          <div className="mt-4">
            <LogoutButton variant="secondary" />
          </div>
        </div>
      </dialog>
    </>
  );
}
