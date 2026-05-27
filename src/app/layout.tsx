import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrow Puzzle - Logic Puzzle Game",
  description: "A relaxing logic puzzle game. Clear arrows by tapping them in the correct order!",
  manifest: "/manifest.json",
  icons: {
    icon: "/game-icon.png",
    apple: "/icons/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arrow Puzzle",
  },
  openGraph: {
    title: "Arrow Puzzle",
    description: "Clear the arrows. Think ahead.",
    images: ["/game-icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4A90D9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Arrow Puzzle" />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
        style={{ overscrollBehavior: 'none', overflow: 'hidden' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
