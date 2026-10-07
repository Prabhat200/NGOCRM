export type ActionCategory =
  | 'all'
  | 'documents'
  | 'occasions'
  | 'members'
  | 'groups'
  | 'users'
  | 'settings'

export interface ActivityLogItem {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor_name: string
  actor_email: string | null
  actor_avatar: string | null
  total_count: number
}

export interface ActivityFilters {
  category: ActionCategory
  userId?: string
  search?: string
  startDate?: string
  endDate?: string
}

export interface FormattedActivity {
  actor: string
  description: string
  resourceTitle?: string
  resourceLink?: string
  resourceType: string
  timestamp: string
  relativeTime: string
  badgeVariant: 'default' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'
}
