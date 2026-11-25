import type { Metadata } from "next";
import { Bangers, Comic_Neue } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { DemoStoreProvider } from "@/lib/firebase-store";
import { AppShell } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";

const display = Bangers({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});
const body = Comic_Neue({
  variable: "--font-body",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harsa Reka Niaga — Export Manga Workspace",
  description:
    "Internal workspace for managing suppliers, buyers, products, export calculations, and commissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f5f0e1] font-sans text-brand-text">
        <DemoStoreProvider>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center bg-[#f5f0e1] text-black font-heading text-2xl tracking-wide">
                LOADING...
              </div>
            }
          >
            <AppShell>{children}</AppShell>
          </Suspense>
        </DemoStoreProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
