import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neon Auto Transport CRM",
  description: "Modern logistics CRM for Neon Auto Transport",
};

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" data-theme="bright">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex bg-background`}
      >
        <AuthProvider>
          {children}
          <ThemeSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
