import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/layout/site-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "ChaseHorse Deploy — Logistics Operations Platform",
    template: "%s | ChaseHorse Deploy",
  },
  description:
    "A connected workspace for logistics assignments, field inspections, inventory checks, delivery evidence and operational reporting.",
  applicationName: "ChaseHorse Deploy",
  keywords: [
    "logistics operations",
    "warehouse inspections",
    "inventory reconciliation",
    "proof of delivery",
    "operations platform",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen bg-white`}>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
