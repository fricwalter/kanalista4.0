"use client";

import Link from "next/link";
import { Clapperboard, Film, Home, Search, Tv } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/_components/language-context";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export default function AppNavigation() {
  const pathname = usePathname();
  const { copy, language, setLanguage } = useLanguage();
  const navigation = [
    { href: "/", label: copy.nav.home, icon: Home },
    { href: "/live", label: copy.nav.live, icon: Tv },
    { href: "/filme", label: copy.nav.movies, icon: Film },
    { href: "/serien", label: copy.nav.series, icon: Clapperboard },
    { href: "/suche", label: copy.nav.search, icon: Search },
  ];

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="brand" aria-label={copy.brandHome}>
            <span className="brand__word">EXJU</span>
            <span className="brand__tv">TV</span>
            <span className="brand__product">Kanalista</span>
          </Link>

          <div className="site-header__actions">
            <nav className="desktop-nav" aria-label={copy.navigation}>
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                    <Icon aria-hidden="true" size={17} strokeWidth={2.2} />{label}
                  </Link>
                );
              })}
            </nav>
            <div className="language-switch" role="group" aria-label={copy.language}>
              {(["bsk", "de"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={language === value} onClick={() => setLanguage(value)}>
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <nav className="mobile-tabbar" aria-label={copy.mobileNavigation}>
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
