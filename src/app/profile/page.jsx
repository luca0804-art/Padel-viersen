'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    display_name: '',
    city: 'Viersen',
    search_radius_km: 25,
    lat: '',
    lng: '',
    rating_elo: 1000
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    let mounted = true
    async function init() {
      const { data } = await supabase.auth.getSession()
      const u = data.session?.user || null
      if (!mounted) return
      setUser(u)
      if (!u) {
        setLoading(false)
        return
      }
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle()
      if (!mounted) return
      if (error) setErr(error.message)
      const parsed = (() => {
        const v = prof?.home_location
        if (!v) return null
        // Supabase may return geography as WKT like "POINT(lng lat)"
        if (typeof v === 'string') {
          const m = v.match(/POINT\s*\(\s*([0-9+\-.]+)\s+([0-9+\-.]+)\s*\)/i)
          if (m) return { lng: m[1], lat: m[2] }
        }
        return null
      })()

      if (prof) {
        setForm({
          display_name: prof.display_name || '',
          city: prof.city || 'Viersen',
          search_radius_km: prof.search_radius_km ?? 25,
          lat: parsed?.lat || '',
          lng: parsed?.lng || '',
          rating_elo: prof.rating_elo ?? 1000
        })
      }
      setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [])

  function useMyLocation() {
    setErr('')
    setMsg('')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErr('Geolocation wird vom Browser nicht unterstützt.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude)
        }))
        setMsg('Standort übernommen. Jetzt noch „Speichern“ drücken.')
      },
      (e) => setErr(e.message || 'Standort konnte nicht abgerufen werden.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function save(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (!user) return setErr('Bitte einloggen.')
    const hasLatLng = String(form.lat).trim() && String(form.lng).trim()
    const payload = {
      id: user.id,
      email: user.email,
      display_name: form.display_name,
      city: (form.city || 'Viersen').trim(),
      search_radius_km: Number(form.search_radius_km) || 25,
      home_location: hasLatLng ? `POINT(${Number(form.lng)} ${Number(form.lat)})` : null,
      rating_elo: Number(form.rating_elo) || 1000,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('profiles').upsert(payload)
    if (error) setErr(error.message)
    else setMsg('Gespeichert.')
  }

  if (loading) return <div className="card">Lädt…</div>

  if (!user) {
    return (
      <div className="card">
        <h1 className="h1">Profil</h1>
        <p className="small">Du bist nicht eingeloggt.</p>
        <Link className="btn primary" href="/login">Zum Login</Link>
      </div>
    )
  }

  return (
    <div className="card">
      <h1 className="h1">Profil</h1>
      <p className="small">Dein Elo ist aktuell: <b>{form.rating_elo}</b></p>

      <form onSubmit={save} className="row" style={{ marginTop: 12 }}>
        <div>
          <div className="label">Anzeigename</div>
          <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="z.B. Alex" />
        </div>
        <div>
          <div className="label">Stadt / Region</div>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="z.B. Viersen" />
        </div>

        <div>
          <div className="label">Suchradius (km)</div>
          <input className="input" type="number" value={form.search_radius_km} onChange={(e) => setForm({ ...form, search_radius_km: e.target.value })} />
          <div className="small" style={{ marginTop: 6 }}>
            Tipp: Für „Viersen & Umgebung“ sind 15–30 km meistens sinnvoll.
          </div>
        </div>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="label">Standort (Lat)</div>
            <input className="input" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="z.B. 51.254" />
          </div>
          <div>
            <div className="label">Standort (Lng)</div>
            <input className="input" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="z.B. 6.394" />
          </div>
        </div>

        <button className="btn" type="button" onClick={useMyLocation}>Standort automatisch übernehmen</button>
        <div>
          <div className="label">Elo (nur zum Start; später automatisch)</div>
          <input className="input" type="number" value={form.rating_elo} onChange={(e) => setForm({ ...form, rating_elo: e.target.value })} />
        </div>

        <button className="btn primary" type="submit">Speichern</button>
        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}
      </form>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <Link className="btn" href="/matches">Matches</Link>
        <Link className="btn" href="/matches/new">Match erstellen</Link>
      </div>
    </div>
  )
}
