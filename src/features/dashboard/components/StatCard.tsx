import { type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: number | null | undefined
  icon: ElementType
  href: string
  linkLabel: string
  isLoading?: boolean
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  linkLabel,
  isLoading = false,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('transition-all hover:border-slate-300 hover:shadow-xs group', className)}>
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 flex items-center justify-center transition-colors">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-9 w-20 rounded" />
            ) : (
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {typeof value === 'number' ? value.toLocaleString() : '0'}
              </span>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100">
          <Link
            to={href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 group-hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <span>{linkLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
