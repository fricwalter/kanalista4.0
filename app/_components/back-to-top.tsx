"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/_components/language-context";

export default function BackToTop() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 700);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  const label = language === "bsk" ? "Nazad na vrh" : "Nach oben";
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label={label}
      title={label}
      onClick={() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }}
    >
      <ArrowUp aria-hidden="true" size={20} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  );
}
