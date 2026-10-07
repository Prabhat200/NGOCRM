import { supabase } from '@/lib/supabase/client'
import type {
  DashboardCounts,
  RecentDocumentItem,
  RecentOccasionItem,
  RecentActivityItem,
} from '../types/dashboard.types'

interface RawDocumentRow {
  id: string
  title: string
  document_number: string | null
  status: string
  updated_at: string
  category?: { name: string } | null
  occasion?: { name: string } | null
}

interface RawOccasionRow {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  location: string | null
  status: string
  type?: { name: string } | null
}

interface RawActivityRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  user_id: string | null
}

export const dashboardService = {
  /**
   * Fetches dashboard metric counts strictly governed by user's RLS visibility.
   * Only queries modules the user has permissions to see.
   */
  async fetchCounts(permissions: Set<string>): Promise<DashboardCounts> {
    const results: DashboardCounts = {
      documents: null,
      occasions: null,
      members: null,
      activity: null,
    }

    const promises: Promise<void>[] = []

    // 1. Documents count (requires documents.view)
    if (permissions.has('documents.view')) {
      promises.push(
        (async () => {
          const { count, error } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
          if (error) {
            console.warn('Dashboard documents count query error:', error.message)
          } else {
            results.documents = count ?? 0
          }
        })()
      )
    }

    // 2. Occasions count (requires occasions.view)
    if (permissions.has('occasions.view')) {
      promises.push(
        (async () => {
          const { count, error } = await supabase
            .from('occasions')
            .select('*', { count: 'exact', head: true })
          if (error) {
            console.warn('Dashboard occasions count query error:', error.message)
          } else {
            results.occasions = count ?? 0
          }
        })()
      )
    }

    // 3. Members count (requires members.view)
    if (permissions.has('members.view')) {
      promises.push(
        (async () => {
          const { count, error } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .is('archived_at', null)
          if (error) {
            console.warn('Dashboard members count query error:', error.message)
          } else {
            results.members = count ?? 0
          }
        })()
      )
    }

    // 4. Activity count (requires audit.view)
    if (permissions.has('audit.view')) {
      promises.push(
        (async () => {
          const { count, error } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
          if (error) {
            console.warn('Dashboard activity count query error:', error.message)
          } else {
            results.activity = count ?? 0
          }
        })()
      )
    }

    await Promise.all(promises)
    return results
  },

  /**
   * Fetches recent accessible documents (RLS protected, limit 5).
   */
  async fetchRecentDocuments(limit = 5): Promise<RecentDocumentItem[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_number,
        status,
        updated_at,
        category:document_categories(name),
        occasion:occasions(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch recent documents:', error.message)
      throw error
    }

    const rows = (data || []) as unknown as RawDocumentRow[]

    return rows.map((doc) => ({
      id: doc.id,
      title: doc.title,
      document_number: doc.document_number,
      status: doc.status,
      updated_at: doc.updated_at,
      category_name: doc.category?.name || null,
      occasion_name: doc.occasion?.name || null,
    }))
  },

  /**
   * Fetches recent or upcoming occasions (RLS protected, limit 5).
   */
  async fetchRecentOccasions(limit = 5): Promise<RecentOccasionItem[]> {
    const { data, error } = await supabase
      .from('occasions')
      .select(`
        id,
        name,
        start_date,
        end_date,
        location,
        status,
        type:occasion_types(name)
      `)
      .order('start_date', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch recent occasions:', error.message)
      throw error
    }

    const rows = (data || []) as unknown as RawOccasionRow[]

    return rows.map((occ) => ({
      id: occ.id,
      name: occ.name,
      start_date: occ.start_date,
      end_date: occ.end_date,
      location: occ.location,
      status: occ.status,
      type_name: occ.type?.name || null,
    }))
  },

  /**
   * Fetches recent organization activity log entries (requires audit.view, limit 6).
   */
  async fetchRecentActivity(limit = 6): Promise<RecentActivityItem[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        created_at,
        metadata,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch recent activity:', error.message)
      throw error
    }

    const rows = (data || []) as unknown as RawActivityRow[]
    const userIds = Array.from(
      new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id)))
    )

    // Lookup user display names
    const profileMap = new Map<string, string>()
    if (userIds.length > 0) {
      try {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, display_name, member:members(full_name)')
          .in('id', userIds)

        if (profileRows) {
          for (const p of profileRows as Array<{ id: string; display_name: string | null; member?: { full_name: string } | null }>) {
            profileMap.set(p.id, p.member?.full_name || p.display_name || 'Portal User')
          }
        }
      } catch (profileErr) {
        console.warn('Profile name resolution error:', profileErr)
      }
    }

    return rows.map((item) => {
      const actorName = item.user_id ? profileMap.get(item.user_id) || 'Staff Member' : 'System'
      return {
        id: item.id,
        action: item.action,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        created_at: item.created_at,
        metadata: item.metadata || {},
        actor_name: actorName,
      }
    })
  },

  /**
   * Fetches unread notifications count for the authenticated user.
   */
  async fetchUnreadNotificationsCount(userId: string): Promise<number> {
    if (!userId) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.warn('Unread notifications count query error:', error.message)
      return 0
    }

    return count ?? 0
  },
}
