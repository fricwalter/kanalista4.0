import type { Metadata } from "next";
import AppNavigation from "@/app/_components/app-navigation";
import { LanguageProvider } from "@/app/_components/language-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanalista 4.0 – IPTV pregled kanala",
  description: "Svi dostupni live kanali, filmovi i serije na jednom mjestu",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <AppNavigation />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
