import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SidebarLayout } from "@/components/sidebar-layout";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { FloatingAssistant } from "@/components/floating-assistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eko Lead Dashboard",
  description: "AI-powered lead generation dashboard for contractors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}
      >
        <Providers>
          <SmoothScrollProvider>
            <SidebarLayout>{children}</SidebarLayout>
            <FloatingAssistant />
          </SmoothScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
