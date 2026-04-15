import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Radix-Trie Dictionary — Interactive Visualization",
  description:
    "An interactive English dictionary powered by a Radix-Trie data structure. Add, search, and delete words with real-time trie visualization.",
  keywords: ["dictionary", "radix trie", "data structure", "english", "compressed trie"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
