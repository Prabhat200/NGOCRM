import type { User, Session } from '@supabase/supabase-js'

export type AccountStatus =
  | 'active'
  | 'invited'
  | 'suspended'
  | 'disabled'
  | 'missing_profile'

export interface UserProfile {
  id: string
  organization_id: string
  person_id: string | null
  member_id: string | null
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  status: 'invited' | 'active' | 'suspended' | 'disabled'
  must_change_password: boolean
  last_active_at: string | null
}

export interface CanonicalPerson {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  preferred_name: string | null
  full_name: string
  primary_email: string | null
  primary_phone: string | null
  photo_path: string | null
  status: 'active' | 'inactive' | 'former' | 'deceased' | 'archived'
}

export interface UserMember {
  id: string
  membership_number: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  full_name: string
  position_title: string | null
  status: 'active' | 'inactive' | 'suspended' | 'former'
}

export interface UserOrganization {
  id: string
  name: string
  short_name: string | null
  logo_url: string | null
  timezone: string
}

export interface UserRole {
  id: string
  name: string
  slug: string
  is_system_role: boolean
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  person: CanonicalPerson | null
  member: UserMember | null
  organization: UserOrganization | null
  roles: UserRole[]
  permissions: Set<string>
  accountStatus: AccountStatus | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
}
