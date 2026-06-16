import Link from "next/link";
import { ClipboardCheck, Home, Plus, UserRound, Zap } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/sprints/demo", label: "Today", icon: Zap },
  { href: "/sprints/demo/proof/new", label: "Log proof", icon: Plus, primary: true },
  { href: "/review/demo", label: "Review", icon: ClipboardCheck },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg border-t border-white/[0.08] bg-[#080d19]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_50px_rgba(0,0,0,.36)] backdrop-blur-xl md:hidden" aria-label="Primary navigation">
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, primary }) => (
          <Link key={href} href={href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold ${primary ? "text-white" : "text-slate-500 hover:text-slate-200"}`}>
            <span className={primary ? "grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_22px_rgba(47,123,255,.35)]" : ""}>
              <Icon size={primary ? 19 : 18} strokeWidth={2.2} />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
