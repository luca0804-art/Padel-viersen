export default function CourtsPage() {
  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Padelplätze in Deutschland
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Hier findest du Padelplätze deutschlandweit. Die Platzsuche wird über Padelfinder eingebettet.
        Die Platzbuchung erfolgt nicht bei uns – bitte kümmert euch selbst um die Reservierung.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <a
          href="/matches/new"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            background: "black",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Match erstellen
        </a>

        <a
          href="https://padelfinder.de"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Padelfinder in neuem Tab öffnen
        </a>
      </div>

      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #eee" }}>
        <iframe
          src="https://padelfinder.de/embedded/"
          title="Padelfinder"
          width="100%"
          height="750"
          style={{ border: 0 }}
        />
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Quelle: Padelfinder (eingebettet per iFrame).
      </p>
    </main>
  );
}
