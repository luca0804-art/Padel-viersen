import Link from 'next/link'

export default function Home() {
  return (
    <div className="grid2">
      <div className="card">
        <h1 className="h1">PadelMatch</h1>
        <p className="small">Verabrede dich direkt mit Spielern in deiner Nähe – ohne Club-Zwang.</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <Link className="btn primary" href="/matches">Matches finden</Link>
          <Link className="btn" href="/matches/new">Match erstellen</Link>
          <Link className="btn" href="/ranking">Ranking</Link>
          <Link className="btn" href="/login">Login</Link>
        </div>

        <div style={{ marginTop: 14 }} className="small">
          Tipp: Starte in <b>einer Stadt</b> und halte den MVP schlank (Login, Match-Board, Join, Ergebnis).
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Was schon drin ist</h2>
        <div className="list">
          <div className="badge">✅ Supabase Auth (Magic Link)</div>
          <div className="badge">✅ Match-Angebote: erstellen, ansehen, beitreten</div>
          <div className="badge">✅ Profil-Grunddaten</div>
          <div className="badge">✅ Einfaches Ranking (nach Elo-Wert im Profil)</div>
        </div>
        <p className="small" style={{ marginTop: 12 }}>
          Als Nächstes: Ergebnis melden + Elo-Update + Disputes/Reports.
        </p>
      </div>
    </div>
  )
}
