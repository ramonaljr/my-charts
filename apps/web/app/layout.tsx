import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NovaCharts - Trading Workstation",
  description: "Personal trading workstation for charting FX/crypto/stocks with technical indicators and alerts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-[#131722] text-white`}
      >
        <main className="h-screen w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
