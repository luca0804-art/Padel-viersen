'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user || null)
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  async function sendMagicLink(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (!email) return setErr('Bitte Email eingeben.')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/profile' : undefined
      }
    })
    if (error) setErr(error.message)
    else setMsg('Check deine Emails – Magic Link wurde gesendet.')
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="card">
      <h1 className="h1">Login</h1>
      <p className="small">Am schnellsten: Magic Link per Email (kein Passwort nötig).</p>

      {user ? (
        <div className="row">
          <div className="ok">Eingeloggt als: {user.email}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn primary" href="/matches">Zu den Matches</Link>
            <Link className="btn" href="/profile">Profil</Link>
            <button className="btn" onClick={signOut}>Logout</button>
          </div>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="row" style={{ marginTop: 12 }}>
          <div>
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button className="btn primary" type="submit">Magic Link senden</button>
          {err && <div className="err">{err}</div>}
          {msg && <div className="ok">{msg}</div>}
        </form>
      )}

      <p className="small" style={{ marginTop: 14 }}>
        Hinweis: Du musst in Supabase unter <b>Authentication → URL Configuration</b> deine Domain als Redirect erlauben.
      </p>
    </div>
  )
}
