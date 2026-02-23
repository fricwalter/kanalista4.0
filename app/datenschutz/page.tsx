export const metadata = {
  title: "Datenschutzerklaerung - Kanalista 4.0",
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <article className="glass-card max-w-3xl mx-auto p-6 md:p-8 space-y-6 text-gray-200">
        <h1 className="text-3xl font-bold text-white">Datenschutzerklaerung</h1>
        <p>
          Diese Datenschutzerklaerung beschreibt, welche personenbezogenen Daten im Rahmen
          der Nutzung von Kanalista 4.0 verarbeitet werden.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">1. Verantwortlicher</h2>
          <p>
            Verantwortlich fuer die Datenverarbeitung ist der Betreiber von Kanalista 4.0.
            Kontakt: support@channel.exyuiptv.org
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">2. Verarbeitete Daten</h2>
          <p>Bei der Nutzung koennen insbesondere folgende Daten verarbeitet werden:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google-Profilinformationen (E-Mail, Name, Avatar)</li>
            <li>Login- und Sitzungsdaten</li>
            <li>Technische Protokolldaten (z.B. IP, Zeitstempel, Fehlerdaten)</li>
            <li>Von dir hinterlegte IPTV-Konfigurationsdaten</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">3. Zweck der Verarbeitung</h2>
          <p>
            Die Verarbeitung erfolgt zur Bereitstellung der App, zur Authentifizierung,
            zur Speicherung deiner Einstellungen und zur technischen Sicherheit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">4. Speicherdauer</h2>
          <p>
            Daten werden nur so lange gespeichert, wie es fuer den jeweiligen Zweck
            erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">5. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung
            der Verarbeitung und Widerspruch gemaess den gesetzlichen Vorgaben.
          </p>
        </section>

        <p className="text-sm text-gray-400">Stand: 23. Februar 2026</p>
      </article>
    </main>
  );
}
