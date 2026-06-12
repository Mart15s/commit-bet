import Link from "next/link";
import { ClipboardCheck, Home, PlusCircle, ScrollText, Users } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";

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
      <header className="sticky top-0 z-30 hidden border-b border-[var(--line)] bg-[#f6f7f2]/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/app" className="text-xl font-black">CommitBet</Link>
          <nav className="flex items-center gap-2">
            {links.map(({ href, label }) => <Link className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-white" key={href} href={href}>{label}</Link>)}
            <form action={logout}><Button type="submit" variant="ghost" size="sm">Log out</Button></form>
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-white px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-black text-[#59635b]" key={href} href={href}>
            <Icon size={20} /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

