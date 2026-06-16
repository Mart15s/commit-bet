import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";
import { BottomNav } from "./bottom-nav";
import { MemberAvatarStack } from "./member-avatar-stack";
import { demoMembers } from "@/lib/demo-data";

export function AppShell({
  children,
  bottomNav = false,
  topBar = true,
  wide = false,
}: {
  children: ReactNode;
  bottomNav?: boolean;
  topBar?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute -left-40 top-16 size-96 rounded-full bg-blue-600/10 blur-[110px]" />
      {topBar && (
        <header className="relative z-20 border-b border-white/[0.06] bg-[#050812]/75 backdrop-blur-xl">
          <div className={`mx-auto flex h-16 items-center justify-between px-4 sm:px-6 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
            <BrandLogo />
            <MemberAvatarStack members={demoMembers} size="sm" />
          </div>
        </header>
      )}
      <main className={`relative z-10 mx-auto px-4 pb-28 pt-6 sm:px-6 sm:pt-9 md:pb-12 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
        {children}
      </main>
      {bottomNav && <BottomNav />}
    </div>
  );
}
