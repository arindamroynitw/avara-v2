import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avara — Your AI Financial Advisor",
  description:
    "Personalised investment advisory for the modern Indian professional. SEBI-registered, AI-powered, built around your interest.",
  manifest: "/manifest.json",
  themeColor: "#1A1A2E",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Avara",
  },
  other: {
    "mobile-web-app-capable": "yes",
    viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
