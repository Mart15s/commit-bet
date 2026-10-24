import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import { getSiteUrl } from "@/lib/auth-config";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0F14",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "5GieAEOU — Ship or explain.",
    template: "%s | 5GieAEOU",
  },
  description:
    "Where promises become shipped reality. Commit, build, submit proof and review with peers. AI audits, humans decide. Public beta uses virtual points only.",
  applicationName: "5GieAEOU",
  icons: {
    icon: [
      { url: "/brand/favicon.ico", sizes: "any" },
      { url: "/brand/icon.png", type: "image/png", sizes: "180x180" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    siteName: "5GieAEOU",
    title: "5GieAEOU — Ship or explain.",
    description: "Where promises become shipped reality. AI audits, humans decide.",
    images: [{
      url: "/brand/opengraph.png",
      width: 1200,
      height: 630,
      alt: "5GieAEOU — Ship or explain. AI audits, humans decide.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "5GieAEOU — Ship or explain.",
    description: "Where promises become shipped reality. AI audits, humans decide.",
    images: ["/brand/opengraph.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/brand/fonts/geist-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/brand/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <Toaster theme="dark" position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}
