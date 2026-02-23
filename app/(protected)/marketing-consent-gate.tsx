"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarketingConsentGate() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/users/marketing-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingOptIn: true }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Einwilligung konnte nicht gespeichert werden.");
      }

      router.refresh();
    } catch (e: any) {
      setError(e.message || "Einwilligung konnte nicht gespeichert werden.");
      setSaving(false);
    }
  };

  return (
    <div className="glass-card max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-white mb-3">Einwilligung erforderlich</h1>
      <p className="text-gray-300 mb-6">
        Bitte bestaetige, dass du E-Mails von <strong>exyuiptv.org</strong> erhalten moechtest.
        Danach geht es direkt ins Dashboard.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2 text-red-300 mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="glass-button-primary px-5 py-3 rounded-xl disabled:opacity-60"
      >
        {saving ? "Speichern..." : "Ich stimme zu"}
      </button>
    </div>
  );
}
