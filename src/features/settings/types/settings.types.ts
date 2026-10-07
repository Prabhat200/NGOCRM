export interface OrganizationSettingsFormValues {
  name: string
  short_name?: string
  logo_url?: string
  email?: string
  phone?: string
  address?: string
  registration_no?: string
  website?: string
  timezone: string
}

export interface DocumentCategory {
  id: string
  organization_id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OccasionType {
  id: string
  organization_id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SystemPermission {
  id: string
  code: string
  description: string
  category: 'Documents' | 'Occasions' | 'Members' | 'Groups' | 'Users & Access' | 'System & Settings'
  label: string
}

export interface RoleWithDetails {
  id: string
  name: string
  slug: string
  description: string | null
  is_system_role: boolean
  created_at: string
  assigned_user_count: number
  permission_ids: string[]
}
