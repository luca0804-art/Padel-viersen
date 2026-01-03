'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function MatchDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  const [user, setUser] = useState(null)
  const [offer, setOffer] = useState(null)
  const [participants, setParticipants] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setErr('')
    setLoading(true)
    const { data: sess } = await supabase.auth.getSession()
    const u = sess.session?.user || null
    setUser(u)

    const { data: off, error: e1 } = await supabase
      .from('match_offers')
      .select('id,created_at,time_start,time_end,format,level_min,level_max,location_text,city,status,creator_id,profiles:creator_id(display_name,rating_elo)')
      .eq('id', id)
      .single()
    if (e1) { setErr(e1.message); setLoading(false); return }
    setOffer(off)

    const { data: parts, error: e2 } = await supabase
      .from('match_participants')
      .select('id,created_at,user_id,profiles:user_id(display_name,rating_elo)')
      .eq('offer_id', id)
      .order('created_at', { ascending: true })
    if (e2) setErr(e2.message)
    setParticipants(parts || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id]) // eslint-disable-line

  const isCreator = user && offer && user.id === offer.creator_id
  const hasJoined = user && participants.some(p => p.user_id === user.id)

  async function join() {
    setErr('')
    if (!user) return setErr('Bitte einloggen.')
    const { error } = await supabase.from('match_participants').insert({ offer_id: id, user_id: user.id })
    if (error) setErr(error.message)
    else load()
  }

  async function leave() {
    setErr('')
    if (!user) return setErr('Bitte einloggen.')
    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('offer_id', id)
      .eq('user_id', user.id)
    if (error) setErr(error.message)
    else load()
  }

  async function cancelOffer() {
    setErr('')
    if (!isCreator) return
    const { error } = await supabase
      .from('match_offers')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) setErr(error.message)
    else router.push('/matches')
  }

  if (loading) return <div className="card">Lädt…</div>
  if (!offer) return <div className="card">Nicht gefunden.</div>

  return (
    <div className="grid">
      <div className="card">
        <div className="split">
          <div>
            <h1 className="h1">Match Details</h1>
            <div className="badge">{offer.status}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" href="/matches">Zur Liste</Link>
            {!user && <Link className="btn primary" href="/login">Login</Link>}
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="row">
          <div>
            <div className="label">Format</div>
            <div>{offer.format}</div>
          </div>
          <div>
            <div className="label">Zeit</div>
            <div className="small">{new Date(offer.time_start).toLocaleString()} – {new Date(offer.time_end).toLocaleString()}</div>
          </div>
          <div>
            <div className="label">Ort</div>
            <div>{offer.location_text} {offer.city ? `• ${offer.city}` : ''}</div>
          </div>
          <div>
            <div className="label">Level</div>
            <div>Elo {offer.level_min}-{offer.level_max}</div>
          </div>
          <div>
            <div className="label">Erstellt von</div>
            <div className="small">{offer.profiles?.display_name || 'Unbekannt'} {offer.profiles?.rating_elo ? `(${offer.profiles.rating_elo} Elo)` : ''}</div>
          </div>
        </div>

        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          {user && !hasJoined && offer.status === 'open' && <button className="btn primary" onClick={join}>Beitreten</button>}
          {user && hasJoined && <button className="btn" onClick={leave}>Verlassen</button>}
          {isCreator && offer.status === 'open' && <button className="btn" onClick={cancelOffer}>Angebot abbrechen</button>}
        </div>

        <p className="small" style={{ marginTop: 12 }}>
          Nächster Schritt im Produkt: Chat + Ergebnis melden (beide bestätigen) + Elo Update.
        </p>
      </div>

      <div className="card">
        <h2 className="h2">Teilnehmer ({participants.length})</h2>
        <div className="list">
          {participants.length === 0 && <div className="small">Noch niemand beigetreten.</div>}
          {participants.map((p) => (
            <div key={p.id} className="split">
              <div>
                <div style={{ fontWeight: 700 }}>{p.profiles?.display_name || 'Spieler'}</div>
                <div className="small">{p.profiles?.rating_elo ? `${p.profiles.rating_elo} Elo` : ''}</div>
              </div>
              <div className="small">{new Date(p.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
