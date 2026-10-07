import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { queryClient } from '@/lib/queryClient'
import { formatAuthError } from '../utils/auth-errors'
import { AuthContext } from './auth-context'
import type {
  AuthContextValue,
  AccountStatus,
  UserProfile,
  UserMember,
  UserOrganization,
  UserRole,
} from '../types/auth.types'

interface RawAuthContextResponse {
  authenticated: boolean
  has_profile?: boolean
  profile?: UserProfile
  member?: UserMember | null
  organization?: UserOrganization | null
  roles?: UserRole[]
  permissions?: string[]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [member, setMember] = useState<UserMember | null>(null)
  const [organization, setOrganization] = useState<UserOrganization | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Atomic bootstrap of application context for current user
  const loadAuthContext = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setMember(null)
      setOrganization(null)
      setRoles([])
      setPermissions(new Set())
      setAccountStatus(null)
      setIsLoading(false)
      return
    }

    setSession(currentSession)
    setUser(currentSession.user)

    try {
      // Single round-trip RPC executing as SECURITY DEFINER
      const { data, error } = await supabase.rpc('get_my_auth_context')

      if (error) {
        console.error('Failed to load auth context:', error)
        setAccountStatus('missing_profile')
        setIsLoading(false)
        return
      }

      const res = data as unknown as RawAuthContextResponse

      if (!res.has_profile || !res.profile) {
        console.warn('Authenticated user has no portal profile record:', currentSession.user.id)
        setProfile(null)
        setMember(null)
        setOrganization(null)
        setRoles([])
        setPermissions(new Set())
        setAccountStatus('missing_profile')
      } else {
        setProfile(res.profile)
        setMember(res.member || null)
        setOrganization(res.organization || null)
        setRoles(res.roles || [])
        setPermissions(new Set(res.permissions || []))
        setAccountStatus(res.profile.status)
      }
    } catch (err) {
      console.error('Unexpected error loading auth context:', err)
      setAccountStatus('missing_profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial session read and real-time subscription
  useEffect(() => {
    let isMounted = true

    async function initSession() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session retrieval error:', error)
        }
        if (isMounted) {
          await loadAuthContext(initialSession)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (isMounted) setIsLoading(false)
      }
    }

    initSession()

    // Subscribe to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          queryClient.clear()
          setSession(null)
          setUser(null)
          setProfile(null)
          setMember(null)
          setOrganization(null)
          setRoles([])
          setPermissions(new Set())
          setAccountStatus(null)
          setIsLoading(false)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await loadAuthContext(newSession)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadAuthContext])

  // Explicit login action
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          return { success: false, error: formatAuthError(error) }
        }

        if (data.session) {
          await loadAuthContext(data.session)
        }

        return { success: true }
      } catch (err) {
        return { success: false, error: formatAuthError(err) }
      }
    },
    [loadAuthContext]
  )

  // Explicit logout action with cache clearing (Rule 19 & 20)
  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Supabase signOut error:', err)
    } finally {
      // Clear all TanStack query cache so sensitive NGO data is not leaked
      queryClient.clear()
      setSession(null)
      setUser(null)
      setProfile(null)
      setMember(null)
      setOrganization(null)
      setRoles([])
      setPermissions(new Set())
      setAccountStatus(null)
      setIsLoading(false)
    }
  }, [])

  // Refresh auth context on profile update
  const refreshAuth = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    await loadAuthContext(currentSession)
  }, [loadAuthContext])

  // Permission helpers
  const hasPermission = useCallback(
    (code: string): boolean => {
      return permissions.has(code)
    },
    [permissions]
  )

  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => {
      return codes.some((code) => permissions.has(code))
    },
    [permissions]
  )

  const hasAllPermissions = useCallback(
    (codes: string[]): boolean => {
      return codes.every((code) => permissions.has(code))
    },
    [permissions]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      member,
      organization,
      roles,
      permissions,
      accountStatus,
      isLoading,
      isAuthenticated: !!session?.user && accountStatus === 'active',
      signIn,
      signOut,
      refreshAuth,
      refreshProfile: refreshAuth,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [
      session,
      user,
      profile,
      member,
      organization,
      roles,
      permissions,
      accountStatus,
      isLoading,
      signIn,
      signOut,
      refreshAuth,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
