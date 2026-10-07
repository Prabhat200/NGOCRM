export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: string
  title: string
  message: string | null
  resource_type: string | null
  resource_id: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}
