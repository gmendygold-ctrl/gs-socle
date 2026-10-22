import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Socle GS Global", template: "%s · Socle GS Global" },
  description: "Socle applicatif sécurisé Next.js + Supabase — GS Global",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
