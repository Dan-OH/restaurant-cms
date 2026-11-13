import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  const [state, setState] = useState({ session: null, loading: true })

  useEffect(() => {
    // Fires immediately with INITIAL_SESSION, then on every sign in / sign out / token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
