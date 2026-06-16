import Link from "next/link";
import { ClipboardCheck, Home, PlusCircle, ScrollText, Users } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/commitbet/brand-logo";

const links = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/teams", label: "Team", icon: Users },
  { href: "/app/projects/new", label: "Create", icon: PlusCircle },
  { href: "/app/approvals", label: "Review", icon: ClipboardCheck },
  { href: "/app/logs/new", label: "Log", icon: ScrollText },
];

export function AppNav() {
  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-white/[0.08] bg-[#050812]/82 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            {links.map(({ href, label }) => <Link className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400 hover:bg-white/[0.06] hover:text-white" key={href} href={href}>{label}</Link>)}
            <form action={logout}><Button type="submit" variant="ghost" size="sm">Log out</Button></form>
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-lg grid-cols-5 border-t border-white/[0.08] bg-[#080d19]/95 px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black text-slate-500 hover:text-slate-200" key={href} href={href}>
            <Icon size={20} /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
