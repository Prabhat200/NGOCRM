import type { Database } from '@/types/database.types'

export type GroupType = Database['public']['Enums']['group_type']

export interface GroupMemberItem {
  id: string
  member_id: string
  name: string
  position: string | null
  role_in_group: string | null
  joined_at: string | null
  is_active: boolean
  created_at: string
}

export interface GroupListItem {
  id: string
  name: string
  description: string | null
  type: GroupType
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  member_count: number
  document_count: number
}

export interface GroupDetail extends GroupListItem {
  created_by: string | null
  creator_name: string | null
}

export interface GroupFiltersState {
  search?: string
  type?: string
  viewTab: 'all' | 'archived'
  page?: number
  pageSize?: number
}

export interface GroupsListResponse {
  groups: GroupListItem[]
  totalCount: number
}
