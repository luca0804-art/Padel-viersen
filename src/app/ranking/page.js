'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function RankingPage() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('Viersen')

  async function load() {
    setErr('')
    setLoading(true)
    let q = supabase.from('profiles').select('id,display_name,city,rating_elo,matches_played').order('rating_elo', { ascending: false }).limit(100)
    if (city.trim()) q = q.ilike('city', `%${city.trim()}%`)
    const { data, error } = await q
    if (error) setErr(error.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div className="card">
      <div className="split">
        <div>
          <h1 className="h1">Ranking</h1>
          <p className="small">Einfaches Ranking nach Elo aus dem Profil (später automatisch per Match-Ergebnis).</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn" href="/profile">Profil</Link>
          <Link className="btn primary" href="/matches">Matches</Link>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="label">Filter: Stadt</div>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="z.B. Berlin" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={load}>Filtern</button>
          <button className="btn" onClick={() => { setCity('Viersen'); setTimeout(load, 0) }}>Reset</button>
        </div>
      </div>

      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div>Lädt…</div>
        ) : (
          <div className="list">
            {rows.map((r, idx) => (
              <div key={r.id} className="split" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>#{idx + 1} {r.display_name || 'Spieler'}</div>
                  <div className="small">{r.city || '—'} • {r.matches_played || 0} Matches</div>
                </div>
                <div style={{ fontWeight: 700 }}>{r.rating_elo ?? 1000}</div>
              </div>
            ))}
            {rows.length === 0 && <div className="small">Noch keine Spieler im Ranking.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
