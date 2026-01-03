'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewMatchPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    format: '2v2',
    time_start: '',
    time_end: '',
    city: 'Viersen',
    location_text: '',
    lat: '',
    lng: '',
    level_min: 900,
    level_max: 1100
  })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
      // prefill city from profile (and optionally reuse saved location)
      const u = data.session?.user
      if (!u) return
      const { data: prof } = await supabase
        .from('profiles')
        .select('city,home_location')
        .eq('id', u.id)
        .maybeSingle()
      if (prof?.city) setForm((f) => ({ ...f, city: prof.city }))
      if (typeof prof?.home_location === 'string') {
        const m = prof.home_location.match(/POINT\s*\(\s*([0-9+\-.]+)\s+([0-9+\-.]+)\s*\)/i)
        if (m) setForm((f) => ({ ...f, lng: m[1], lat: m[2] }))
      }
    })()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    const { data } = await supabase.auth.getSession()
    const u = data.session?.user
    if (!u) return setErr('Bitte einloggen.')
    if (!form.time_start || !form.time_end) return setErr('Bitte Start- und Endzeit setzen.')
    if (!form.location_text) return setErr('Bitte Ort/Adresse angeben.')

    const payload = {
      creator_id: u.id,
      format: form.format,
      time_start: new Date(form.time_start).toISOString(),
      time_end: new Date(form.time_end).toISOString(),
      city: (form.city || 'Viersen').trim(),
      location_text: form.location_text,
      location: (String(form.lat).trim() && String(form.lng).trim()) ? `POINT(${Number(form.lng)} ${Number(form.lat)})` : null,
      level_min: Number(form.level_min) || 0,
      level_max: Number(form.level_max) || 9999,
      status: 'open'
    }

    const { data: created, error } = await supabase.from('match_offers').insert(payload).select('id').single()
    if (error) return setErr(error.message)
    setMsg('Match erstellt!')
    router.push(`/matches/${created.id}`)
  }

  if (!user) {
    return (
      <div className="card">
        <h1 className="h1">Match erstellen</h1>
        <p className="small">Du musst eingeloggt sein.</p>
        <Link className="btn primary" href="/login">Zum Login</Link>
      </div>
    )
  }

  return (
    <div className="card">
      <h1 className="h1">Match erstellen</h1>
      <p className="small">Erstelle ein Match-Angebot (ohne Club-Zwang).</p>

      <form onSubmit={submit} className="row" style={{ marginTop: 12 }}>
        <div>
          <div className="label">Format</div>
          <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            <option value="2v2">2v2 (Standard Padel)</option>
            <option value="1v1">1v1</option>
          </select>
        </div>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="label">Start</div>
            <input className="input" type="datetime-local" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
          </div>
          <div>
            <div className="label">Ende</div>
            <input className="input" type="datetime-local" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
          </div>
        </div>

        <div>
          <div className="label">Ort (Adresse / Courtname)</div>
          <input className="input" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} placeholder="z.B. Volkspark Court 2, Musterstraße 1" />
        </div>

        <div>
          <div className="label">Stadt / Region</div>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="z.B. Berlin" />
        </div>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="label">Standort (Lat) – optional</div>
            <input className="input" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="z.B. 51.254" />
          </div>
          <div>
            <div className="label">Standort (Lng) – optional</div>
            <input className="input" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="z.B. 6.394" />
          </div>
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => {
            setErr('')
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
              return setErr('Geolocation nicht verfügbar. Du kannst Lat/Lng auch manuell eintragen.')
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => setForm((f) => ({ ...f, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })),
              () => setErr('Standort konnte nicht abgerufen werden. Bitte Berechtigung erlauben.'),
              { enableHighAccuracy: true, timeout: 10000 }
            )
          }}
        >
          Standort vom Handy übernehmen
        </button>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="label">Elo min</div>
            <input className="input" type="number" value={form.level_min} onChange={(e) => setForm({ ...form, level_min: e.target.value })} />
          </div>
          <div>
            <div className="label">Elo max</div>
            <input className="input" type="number" value={form.level_max} onChange={(e) => setForm({ ...form, level_max: e.target.value })} />
          </div>
        </div>

        <button className="btn primary" type="submit">Erstellen</button>
        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}
      </form>
    </div>
  )
}
