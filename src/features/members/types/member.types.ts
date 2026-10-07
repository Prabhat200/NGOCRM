import type { Database } from '@/types/database.types'

export type MemberStatus = Database['public']['Enums']['member_status']
export type PortalStatus = 'no_access' | 'invited' | 'active' | 'suspended' | 'disabled'

export interface MemberGroupAssociation {
  group_id: string
  group_name: string
  role_in_group: string | null
}

export interface MemberPortalRole {
  id: string
  name: string
  slug: string
}

export interface MemberListItem {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  full_name: string
  membership_number: string | null
  position_title: string | null
  status: MemberStatus
  groups: MemberGroupAssociation[]
  portal_status: PortalStatus
  portal_user_id: string | null
  portal_roles: MemberPortalRole[]
  archived_at: string | null
  email?: string | null
  phone?: string | null
  created_at: string
  updated_at: string
}

export interface MemberDetail extends MemberListItem {
  email: string | null
  phone: string | null
  address: string | null
  joined_at: string | null
  left_at: string | null
  notes: string | null
  can_view_sensitive: boolean
}

export interface MemberFiltersState {
  search?: string
  status?: string
  groupId?: string
  position?: string
  portalStatus?: string
  viewTab: 'all' | 'archived'
  page: number
  pageSize: number
}

export interface MembersListResponse {
  members: MemberListItem[]
  totalCount: number
}
