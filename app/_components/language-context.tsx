"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "bsk" | "de";

const COPY = {
  bsk: {
    nav: { home: "Početna", live: "Live", movies: "Filmovi", series: "Serije", search: "Pretraga" },
    navigation: "Glavna navigacija",
    mobileNavigation: "Mobilna navigacija",
    brandHome: "EXJU TV Kanalista – Početna",
    language: "Jezik",
    home: {
      title: "Šta se gleda?",
      lead: "Pronađi TV kanale, filmove i serije bez lutanja. Pregled ne prikazuje pristupne podatke niti adrese streamova.",
      openLive: "Otvori Live",
      searchAll: "Pretraži sve",
      live: "Live kanali",
      liveNote: "EXYU prvo, zatim Njemačka",
      movies: "Filmovi",
      moviesNote: "Brzo filtriranje po kategoriji",
      series: "Serije",
      seriesNote: "Pregledno i prilagođeno mobitelu",
      footnote: "Katalog EXJU TV-a · Prilagođen za mobitel, tablet i TV.",
      contents: "Sadržaj",
    },
    catalog: {
      liveTitle: "Live kanali",
      moviesTitle: "Filmovi",
      seriesTitle: "Serije",
      publicOverview: "Javni pregled",
      liveUnit: "live kanala",
      moviesUnit: "filmova",
      seriesUnit: "serija",
      loading: "Učitava …",
      results: "rezultata",
      filterChannels: "Filtriraj kanale",
      search: "Pretraga",
      searchPlaceholder: "Pretraži kanal, film ili seriju",
      chooseRegion: "Izaberi regiju",
      all: "Sve",
      category: "Kategorija",
      allCategories: "Sve kategorije",
      unknownTitle: "Nepoznat naslov",
      withoutCategory: "Bez kategorije",
      showMore: "Prikaži još",
      showMoreSuffix: "",
      loadError: "Podaci se trenutno ne mogu učitati.",
      empty: "Nema sadržaja za izabrane filtere.",
      rating: "Ocjena",
      lastUpdated: "Ažurirano",
    },
    globalSearch: {
      title: "Pretraži sve",
      placeholder: "Kanal, film, serija ili žanr …",
      maxResults: "Do 120 rezultata po sekciji",
      minChars: "Upiši najmanje dva znaka",
      noResults: "Nema rezultata.",
    },
  },
  de: {
    nav: { home: "Start", live: "Live", movies: "Filme", series: "Serien", search: "Suche" },
    navigation: "Hauptnavigation",
    mobileNavigation: "Mobile Navigation",
    brandHome: "EXJU TV Kanalista – Startseite",
    language: "Sprache",
    home: {
      title: "Was läuft?",
      lead: "Finde Live-Kanäle, Filme und Serien ohne Umwege. Die Übersicht zeigt keine Zugangsdaten oder Stream-Adressen.",
      openLive: "Live öffnen",
      searchAll: "Alles durchsuchen",
      live: "Live-Kanäle",
      liveNote: "EXYU zuerst, danach Deutschland",
      movies: "Filme",
      moviesNote: "Schnell nach Kategorie filtern",
      series: "Serien",
      seriesNote: "Übersichtlich und mobil optimiert",
      footnote: "Ein Katalog von EXJU TV · Für Handy, Tablet und Fernseher optimiert.",
      contents: "Inhalte",
    },
    catalog: {
      liveTitle: "Live-Kanäle",
      moviesTitle: "Filme",
      seriesTitle: "Serien",
      publicOverview: "Öffentliche Übersicht",
      liveUnit: "Live-Kanäle",
      moviesUnit: "Filme",
      seriesUnit: "Serien",
      loading: "Lädt …",
      results: "Treffer",
      filterChannels: "Kanäle filtern",
      search: "Suchen",
      searchPlaceholder: "Kanal, Film oder Serie suchen",
      chooseRegion: "Region auswählen",
      all: "Alle",
      category: "Kategorie",
      allCategories: "Alle Kategorien",
      unknownTitle: "Unbekannter Titel",
      withoutCategory: "Ohne Kategorie",
      showMore: "Weitere",
      showMoreSuffix: "anzeigen",
      loadError: "Daten konnten nicht geladen werden.",
      empty: "Keine Einträge für die aktuelle Auswahl gefunden.",
      rating: "Bewertung",
      lastUpdated: "Zuletzt aktualisiert",
    },
    globalSearch: {
      title: "Alles durchsuchen",
      placeholder: "Sender, Film, Serie oder Genre …",
      maxResults: "Bis zu 120 Treffer je Bereich",
      minChars: "Mindestens zwei Zeichen eingeben",
      noResults: "Keine Treffer.",
    },
  },
} as const;

type LanguageContextValue = {
  language: Language;
  locale: "bs-BA" | "de-DE";
  copy: (typeof COPY)[Language];
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bsk");

  useEffect(() => {
    const stored = window.localStorage.getItem("kanalista-language");
    if (stored === "de" || stored === "bsk") setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "bsk" ? "bs" : "de";
    document.title = language === "bsk" ? "Kanalista 4.0 – IPTV pregled kanala" : "Kanalista 4.0 – IPTV-Kanalübersicht";
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = language === "bsk"
        ? "Svi dostupni live kanali, filmovi i serije na jednom mjestu"
        : "Alle verfügbaren Live-Kanäle, Filme und Serien im Überblick";
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    locale: language === "bsk" ? "bs-BA" : "de-DE",
    copy: COPY[language],
    setLanguage: (nextLanguage) => {
      setLanguageState(nextLanguage);
      window.localStorage.setItem("kanalista-language", nextLanguage);
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
