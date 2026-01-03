'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function MatchesPage() {
  const [user, setUser] = useState(null)
  const [offers, setOffers] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState('Viersen')
  const [radiusKm, setRadiusKm] = useState(25)
  const [useRadius, setUseRadius] = useState(true)
  const [myPos, setMyPos] = useState(null) // {lat,lng}

  function parsePointWKT(v) {
    if (!v || typeof v !== 'string') return null
    const m = v.match(/POINT\s*\(\s*([0-9+\-.]+)\s+([0-9+\-.]+)\s*\)/i)
    if (!m) return null
    return { lng: Number(m[1]), lat: Number(m[2]) }
  }

  async function load() {
    setErr('')
    setLoading(true)
    const { data: sess } = await supabase.auth.getSession()
    setUser(sess.session?.user || null)

    // If logged in: load profile (city + radius + optional saved location)
    let profile = null
    if (sess.session?.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('city,search_radius_km,home_location')
        .eq('id', sess.session.user.id)
        .maybeSingle()
      profile = prof || null
      if (prof?.city && !cityFilter) setCityFilter(prof.city)
      if (prof?.search_radius_km) setRadiusKm(prof.search_radius_km)
      const p = parsePointWKT(prof?.home_location)
      if (p) setMyPos(p)
    }

    const effectiveCity = (cityFilter || profile?.city || 'Viersen').trim()
    const effectiveRadius = Number(radiusKm || profile?.search_radius_km || 25)
    const pos = myPos || parsePointWKT(profile?.home_location)

    // Prefer radius search if we have a position + user wants it
    if (useRadius && pos && Number.isFinite(effectiveRadius)) {
      const { data, error } = await supabase.rpc('nearby_match_offers', {
        p_lat: pos.lat,
        p_lng: pos.lng,
        p_radius_km: effectiveRadius
      })
      if (error) setErr(error.message)
      setOffers((data || []).map((o) => ({
        ...o,
        profiles: { display_name: o.creator_display_name, rating_elo: o.creator_rating_elo }
      })))
      setLoading(false)
      return
    }

    // Fallback: city filter
    let q = supabase
      .from('match_offers')
      .select('id,created_at,time_start,time_end,format,level_min,level_max,location_text,city,status,creator_id,profiles:creator_id(display_name,city,rating_elo)')
      .order('time_start', { ascending: true })
      .limit(50)

    if (effectiveCity) q = q.ilike('city', `%${effectiveCity}%`)

    const { data, error } = await q
    if (error) setErr(error.message)
    setOffers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  async function join(offerId) {
    setErr('')
    const { data: sess } = await supabase.auth.getSession()
    const u = sess.session?.user
    if (!u) return setErr('Bitte einloggen, um beizutreten.')
    const { error } = await supabase.from('match_participants').insert({
      offer_id: offerId,
      user_id: u.id
    })
    if (error) setErr(error.message)
    else load()
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="split">
          <div>
            <h1 className="h1">Matches</h1>
            <p className="small">Finde offene Match-Angebote und tritt bei.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn primary" href="/matches/new">+ Match erstellen</Link>
            <button className="btn" onClick={load}>Aktualisieren</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="label">Filter: Viersen & Umgebung</div>
          <div className="row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
            <div>
              <div className="label">Stadt / Region</div>
              <input className="input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="z.B. Viersen" />
            </div>
            <div>
              <div className="label">Umkreis (km)</div>
              <input className="input" type="number" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button className={`btn ${useRadius ? 'primary' : ''}`} onClick={() => setUseRadius(true)} type="button">Umkreis</button>
            <button className={`btn ${!useRadius ? 'primary' : ''}`} onClick={() => setUseRadius(false)} type="button">Nur Stadt</button>
            <button className="btn" type="button" onClick={() => {
              setErr('')
              if (!navigator.geolocation) return setErr('Geolocation nicht verfügbar. Bitte im Profil Lat/Lng setzen.')
              navigator.geolocation.getCurrentPosition(
                (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setErr('Standort konnte nicht abgerufen werden. Berechtigung erlauben oder Profil-Standort nutzen.')
              )
            }}>Standort aktualisieren</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={load}>Filtern</button>
            <button className="btn" onClick={() => { setCityFilter('Viersen'); setRadiusKm(25); setTimeout(load, 0) }}>Reset</button>
            {!user && <Link className="btn" href="/login">Login</Link>}
          </div>
        </div>

        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
      </div>

      <div className="card">
        {loading ? (
          <div>Lädt…</div>
        ) : (
          <div className="list">
            {offers.length === 0 && <div className="small">Keine offenen Matches gefunden.</div>}
            {offers.map((o) => (
              <div key={o.id} className="card" style={{ padding: 14 }}>
                <div className="split">
                  <div>
                    <div style={{ fontWeight: 700 }}>{o.format} • Elo {o.level_min}-{o.level_max}</div>
                    <div className="small">
                      {new Date(o.time_start).toLocaleString()} – {new Date(o.time_end).toLocaleTimeString()}
                    </div>
                    <div className="small">{o.location_text} {o.city ? `• ${o.city}` : ''}</div>
                    <div className="small">
                      Erstellt von: {o.profiles?.display_name || 'Unbekannt'} {o.profiles?.rating_elo ? `(${o.profiles.rating_elo} Elo)` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn primary" onClick={() => join(o.id)}>Beitreten</button>
                    <Link className="btn" href={`/matches/${o.id}`}>Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
