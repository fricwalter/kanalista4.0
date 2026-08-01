"use client";

import Link from "next/link";
import { Clapperboard, Film, Home, Search, Tv } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Start", icon: Home },
  { href: "/live", label: "Live", icon: Tv },
  { href: "/filme", label: "Filme", icon: Film },
  { href: "/serien", label: "Serien", icon: Clapperboard },
  { href: "/suche", label: "Suche", icon: Search },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="brand" aria-label="EXJU TV Kanalista – Startseite">
            <span className="brand__word">EXJU</span>
            <span className="brand__tv">TV</span>
            <span className="brand__product">Kanalista</span>
          </Link>

          <nav className="desktop-nav" aria-label="Hauptnavigation">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                  <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="mobile-tabbar" aria-label="Mobile Navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
