import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AppPrivyProvider } from "@/components/providers/privy-provider";

export const metadata: Metadata = {
  title: "DeFi Smallcases",
  description: "Curated baskets of DeFi strategies inspired by smallcase design.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ClerkProvider>
          <AppPrivyProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ThemeProvider>
          </AppPrivyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
