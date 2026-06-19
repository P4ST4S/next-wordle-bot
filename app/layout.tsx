import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
      <body className={`${libreFranklin.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
