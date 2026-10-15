import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "./components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mafteach — Painel",
  description: "Sistema de administração de clientes da Mafteach",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
            <body className="min-h-full flex bg-bg text-text font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}