'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthGate({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    supabase.auth.getSession().then(({ data }) => {
      if (ignore) return
      if (!data.session) router.replace('/login')
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [router])

  if (loading) {
    return <div className="card">Lade…</div>
  }

  return children
}
