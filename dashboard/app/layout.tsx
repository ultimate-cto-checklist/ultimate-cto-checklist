import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CTO Checklist",
  description: "Comprehensive checklist dashboard for technical leadership",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 shadow-lg shadow-teal-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  CTO Checklist
                </h1>
                <p className="text-teal-100 text-sm">Technical leadership audit companion</p>
              </div>
              <nav className="flex items-center gap-4 ml-auto">
                <a href="/" className="text-teal-100 hover:text-white text-sm font-medium transition-colors">
                  Checklist
                </a>
                <a href="/audits" className="text-teal-100 hover:text-white text-sm font-medium transition-colors">
                  Audits
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
