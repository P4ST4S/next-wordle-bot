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
  title: "Wordle Solver Bot | Shannon Entropy-Powered",
  description: "High-performance Wordle solver using Shannon Entropy algorithm. Built with Next.js 16, React 19, and Web Workers for optimal guess suggestions.",
  keywords: ["wordle", "solver", "shannon entropy", "information theory", "next.js", "react"],
  authors: [{ name: "Antoine Rospars" }],
  openGraph: {
    title: "Wordle Solver Bot",
    description: "Shannon Entropy-powered optimal Wordle solver",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
