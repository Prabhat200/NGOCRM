import { supabase } from '@/lib/supabase/client'
import { ActivityFilters, ActivityLogItem } from '../types/activity.types'

export interface GetActivityLogsParams extends ActivityFilters {
  page?: number
  pageSize?: number
}

export interface ActivityLogsResult {
  logs: ActivityLogItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchActivityLogs(
  params: GetActivityLogsParams = { category: 'all' }
): Promise<ActivityLogsResult> {
  const page = params.page || 1
  const pageSize = params.pageSize || 25
  const categoryParam = params.category === 'all' ? null : params.category

  const { data, error } = await supabase.rpc('get_activity_logs', {
    p_page: page,
    p_page_size: pageSize,
    p_action_category: categoryParam || undefined,
    p_user_id: params.userId || undefined,
    p_search: params.search?.trim() || undefined,
    p_start_date: params.startDate || undefined,
    p_end_date: params.endDate || undefined,
  })

  if (error) {
    throw new Error(error.message || 'We could not load the activity history.')
  }

  const logs = (data as unknown as ActivityLogItem[]) || []
  const totalCount = logs.length > 0 ? Number(logs[0].total_count) : 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return {
    logs,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}
