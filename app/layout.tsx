import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { AiChatWidget } from "@/components/ai-chat-widget";
import { Providers } from "@/components/providers";
import { SessionWatcher } from "@/components/session-watcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "家庭理财管理系统",
  description: "全能家庭财务管家",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <SessionWatcher />
          <Navbar />
          {children}
          <AiChatWidget />
          <Toaster />
          <SonnerToaster position="top-left" duration={1000} />
        </Providers>
      </body>
    </html>
  );
}
