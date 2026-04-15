import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NetWebMedia CRM",
  description: "All-in-one CRM platform by NetWebMedia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="h-full flex">
        <Sidebar />
        <main className="ml-60 flex-1 min-h-screen p-6 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
