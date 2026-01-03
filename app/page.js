export default function HomePage() {
  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Padel Match
      </h1>

      <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Finde Spieler in deiner Nähe, erstelle Matches und spiele (optional) fürs Ranking.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="/courts"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Padelplätze
        </a>
      </div>
    </main>
  );
}
