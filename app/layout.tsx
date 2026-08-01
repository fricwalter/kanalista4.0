import type { Metadata } from "next";
import AppNavigation from "@/app/_components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanalista 4.0 – IPTV-Kanalübersicht",
  description: "Alle verfügbaren Live-Kanäle, Filme und Serien im Überblick",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}
