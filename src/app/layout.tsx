import type { Metadata } from "next";
import Script from "next/script";
import { BoCompanion } from "@/components/BoCompanion";
import { BoProvider } from "@/components/BoContext";
import { LandingAuthTransitionProvider } from "@/components/LandingAuthTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sealit — Build things that need to exist.",
  description:
    "A personalized feed of real unsolved problems — scraped from Reddit and HN, structured by AI, matched to your stack.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <BoProvider>
            <LandingAuthTransitionProvider>
              {children}
              <BoCompanion />
            </LandingAuthTransitionProvider>
          </BoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
