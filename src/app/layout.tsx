import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import "driver.js/dist/driver.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/constants";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Clash Display (local) — the display face for big headlines, matching the brand reference.
const clashDisplay = localFont({
  variable: "--font-clash",
  display: "swap",
  src: [
    { path: "./fonts/ClashDisplay-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.otf", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, Verifiable AI for Sui`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name}, Verifiable AI for Sui`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}, Verifiable AI for Sui`,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${clashDisplay.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* Arm the landing-page reveal animations BEFORE first paint. Runs during
            HTML parse (so the CSS pre-hide under `html.gsap-armed` applies on the
            very first frame → zero FOUC). Only arms when JS is live AND motion is
            allowed; with JS off or prefers-reduced-motion the class is never added
            and all content renders fully visible. Kept tiny + dependency-free. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.matchMedia&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('gsap-armed');}}catch(e){}})();",
          }}
        />
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
