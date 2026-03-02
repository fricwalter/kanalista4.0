import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanalista 4.0 - IPTV Kanaluebersicht",
  description: "Alle verfuegbaren Live-Kanaele, Filme und Serien im Ueberblick",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
