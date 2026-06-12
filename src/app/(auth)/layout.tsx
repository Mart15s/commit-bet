import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-xl font-black">CommitBet</Link>
        {children}
      </div>
    </main>
  );
}

