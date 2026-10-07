import { Skeleton } from '@/components/ui/skeleton'

export interface LoadingStateProps {
  count?: number
  message?: string
}

export function LoadingState({ count = 3, message = 'Loading content...' }: LoadingStateProps) {
  return (
    <div className="space-y-4 w-full" aria-busy="true" aria-label={message}>
      <div className="flex items-center justify-between pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
