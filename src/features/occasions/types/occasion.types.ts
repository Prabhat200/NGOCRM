import type { Database } from '@/types/database.types'

export type OccasionStatus = Database['public']['Enums']['occasion_status']

export interface OccasionType {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
}

export interface OccasionListItem {
  id: string
  name: string
  description: string | null
  occasion_type_id: string | null
  type_name: string | null
  type_icon: string | null
  start_date: string | null
  end_date: string | null
  location: string | null
  status: OccasionStatus
  fiscal_year: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  document_count: number
  member_count: number
}

export interface OccasionDetail extends OccasionListItem {
  created_by: string | null
  creator_name: string | null
}

export interface OccasionMemberItem {
  id: string
  member_id: string
  name: string
  position: string | null
  role: string | null
  created_at: string
}

export interface OccasionFiltersState {
  search?: string
  typeId?: string
  status?: string
  fiscalYear?: string
  viewTab: 'all' | 'upcoming' | 'completed' | 'archived'
  page: number
  pageSize: number
}

export interface OccasionsListResponse {
  occasions: OccasionListItem[]
  totalCount: number
}

export interface SafeMemberDirectoryItem {
  id: string
  full_name: string
  position_title: string | null
  email: string | null
}
