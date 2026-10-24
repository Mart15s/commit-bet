import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B1220",
};

export const metadata: Metadata = {
  title: "CommitBet - Finish what your team starts",
  description:
    "Evidence-based accountability sprints with AI recommendations and human decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>
          {children}
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}
