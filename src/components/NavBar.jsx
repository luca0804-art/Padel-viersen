'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function NavBar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let ignore = false

    supabase.auth.getSession().then(({ data }) => {
      if (!ignore) setUser(data.session?.user || null)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setUser(session?.user || null)
    })

    return () => {
      ignore = true
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="nav">
      <div className="left">
        <Link className="brand" href="/">PadelMatch</Link>
        <Link href="/matches">Matches</Link>
        <Link href="/ranking">Ranking</Link>
      </div>

      <div className="left">
        {user ? (
          <>
            <Link href="/profile">Profil</Link>
            <button className="btn" onClick={signOut}>Logout</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </div>
  )
}
