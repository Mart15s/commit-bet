import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import { TrustFooter } from "@/components/trust-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommitBet - Finish what your team starts",
  description: "Evidence-based accountability sprints with AI recommendations and human decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
          <TrustFooter />
          <Toaster richColors position="top-center" />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
