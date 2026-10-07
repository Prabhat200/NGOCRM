import { supabase } from '@/lib/supabase/client'
import { Notification } from '../types/notification.types'

export interface GetNotificationsParams {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
}

export interface NotificationsResult {
  notifications: Notification[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchNotifications({
  page = 1,
  pageSize = 20,
  unreadOnly = false,
}: GetNotificationsParams = {}): Promise<NotificationsResult> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(error.message || 'We could not load your notifications.')
  }

  const notifications = (data as Notification[]) || []
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return {
    notifications,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    return 0
  }

  return count || 0
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message || 'Failed to mark notification as read.')
  }
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    throw new Error(error.message || 'Failed to mark all notifications as read.')
  }

  return (data as number) || 0
}
