export const metadata = {
  title: "Nutzungsbedingungen - Kanalista 4.0",
};

export default function NutzungsbedingungenPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <article className="glass-card max-w-3xl mx-auto p-6 md:p-8 space-y-6 text-gray-200">
        <h1 className="text-3xl font-bold text-white">Nutzungsbedingungen</h1>
        <p>
          Diese Nutzungsbedingungen regeln die Nutzung von Kanalista 4.0.
          Mit der Nutzung der Anwendung akzeptierst du diese Bedingungen.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">1. Leistungsbeschreibung</h2>
          <p>
            Kanalista 4.0 ist eine oeffentliche Uebersicht fuer Live-Kanaele, Filme und
            Serien auf Basis gespeicherter Metadaten.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">2. Verantwortlichkeit der Nutzer</h2>
          <p>
            Betreiber und Administratoren sind dafuer verantwortlich, dass importierte
            Inhalte und Datenquellen rechtmaessig verwendet werden.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">3. Verfuegbarkeit</h2>
          <p>
            Es besteht kein Anspruch auf dauerhafte oder stoerungsfreie Verfuegbarkeit
            der Anwendung.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">4. Haftung</h2>
          <p>
            Der Betreiber haftet nur im gesetzlich vorgesehenen Umfang. Fuer vom Nutzer
            hinterlegte Inhalte und Quellen ist ausschliesslich der Nutzer verantwortlich.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">5. Aenderungen</h2>
          <p>
            Der Betreiber kann diese Bedingungen mit Wirkung fuer die Zukunft anpassen.
          </p>
        </section>

        <p className="text-sm text-gray-400">Stand: 2. Maerz 2026</p>
      </article>
    </main>
  );
}
