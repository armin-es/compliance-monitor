import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compliance Monitor — EASE IQ",
  description: "Monitor and log process compliance in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full">
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
