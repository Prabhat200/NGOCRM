export interface DashboardCounts {
  documents: number | null
  occasions: number | null
  members: number | null
  activity: number | null
}

export interface RecentDocumentItem {
  id: string
  title: string
  document_number: string | null
  status: string
  updated_at: string
  category_name: string | null
  occasion_name: string | null
}

export interface RecentOccasionItem {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  location: string | null
  status: string
  type_name: string | null
}

export interface RecentActivityItem {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  metadata: Record<string, unknown>
  actor_name: string | null
}
