import { useQuery } from '@tanstack/react-query'
import { fetchActivityLogs, GetActivityLogsParams } from '../services/activity.service'

export function useActivityLogs(params: GetActivityLogsParams) {
  return useQuery({
    queryKey: ['activity', params.category, params.userId, params.search, params.startDate, params.endDate, params.page, params.pageSize],
    queryFn: () => fetchActivityLogs(params),
    staleTime: 1000 * 30, // 30 seconds
  })
}
